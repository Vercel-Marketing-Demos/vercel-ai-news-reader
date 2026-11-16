import "server-only";
import { cache } from "react";
import { neon } from "@neondatabase/serverless";

// Every Signal belongs to whoever deployed it, and anyone with its link can use all of it, so there's
// no sign-in. What the data layer still guards is cost: interest changes are limited to one every
// 15 minutes, and Ask Signal to a number of conversations a day (agent/channels/eve.ts).
const sql = neon(process.env.DATABASE_URL!);

export type Profile = { about: string; topics: string[] };

export type Source = { name: string; kind: string; url: string; enabled: boolean };

// A paragraph of the article. `mark` is the [start, end) of a key passage in it, with Signal's note;
// `gap` means paragraphs were skipped before it.
export type Paragraph = { text: string; gap: boolean; mark?: [number, number]; note?: string };

export type FeedItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  published_at: string;
  status: "scored" | "no-match" | "pending"; // no-match: the quick check said skip it; pending: not checked yet
  score: number | null;
  why: string | null; // one line, shown on the card
  detail: string | null; // the rest of why it matters, shown when the story is open
  topics: string[]; // private profile matches; empty for anonymous visitors
  takeaways: string[]; // 2 to 4 bullets, shown when the story is open
  reading: Paragraph[]; // the article as the open story shows it; empty until scored
  // The preview you see when you expand a story. Null when the site blocks readers.
  image: string | null;
  description: string | null;
  author: string | null;
  excerpt: string; // the article's opening; the rest stays at the source
  headlineOnly: boolean; // the page couldn't be read, so Signal has only the headline and a line of summary
  coverage: { source: string; url: string } | null; // another source's story Signal read instead
};

// Null until you've said what you care about: then Signal opens on Setup to ask. Cached per request,
// since Setup's layout and its page both read it.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const [row] = await sql`select about, topics from profile`;
  return (row as Profile) ?? null;
});

export async function saveProfile({ about, topics }: Profile) {
  about = about.trim();
  topics = [...new Set(topics)].sort();
  if (!about || about.length > 2000 || topics.length > 10 ||
      topics.some((topic) => !topic || topic.length > 100)) {
    throw new Error("Invalid profile");
  }

  // The row lock in ON CONFLICT makes admission atomic across web instances.
  // Delete old scores only when a changed profile is actually admitted.
  const [row] = await sql`
    with changed as (
      insert into profile (about, topics) values (${about}, ${topics})
      on conflict (id) do update set
        about = excluded.about, topics = excluded.topics,
        version = profile.version + 1, updated_at = now()
      where (profile.about, profile.topics) is distinct from (excluded.about, excluded.topics)
        and profile.updated_at <= now() - interval '15 minutes'
      returning version
    ), cleared as (
      delete from scores where exists (select 1 from changed)
    )
    select exists (select 1 from changed) as changed,
      exists (select 1 from profile where about = ${about} and topics = ${topics}) as unchanged
  `;
  if (!row.changed && !row.unchanged) {
    throw new Error("Profile changes are limited to once every 15 minutes. Please try again later.");
  }
  return Boolean(row.changed);
}

// Grouped by kind, with Vercel's own sources first in theirs, then by name.
export async function getSources(): Promise<Source[]> {
  return (await sql`
    select name, kind, url, enabled from feeds
    order by array_position(array['News', 'AI labs', 'Platforms', 'Writers'], kind),
      array_position(array['Vercel', 'Next.js'], name) nulls last, name
  `) as Source[];
}

// Turns one source on or off. The feed follows right away; the scorer reads it on its next scan.
export async function setSourceEnabled(name: string, enabled: boolean) {
  await sql`update feeds set enabled = ${enabled} where name = ${name}`;
}

export type Sort = "relevance" | "latest";

// The opening shown for stories without a reading view yet (not scored, or scored before it existed).
export const EXCERPT_CHARS = 600;

// An unread article with less text than this is only a headline and a summary (BRIEF_CHARS in the scorer).
const HEADLINE_ONLY_CHARS = 1000;

// The filter is "no-match" or a topic; null shows everything.
export async function getFeed(sort: Sort, filter: string | null): Promise<FeedItem[]> {
  // Relevance ranks the past week by score. Stories without one come last.
  const rows = await sql`
    select a.id, a.url, a.title, a.source, a.published_at, s.score, s.why, s.detail,
      a.read_at is null and length(a.text) < ${HEADLINE_ONLY_CHARS} as "headlineOnly",
      case when c.id is null then null else json_build_object('source', c.source, 'url', c.url) end as coverage,
      case when s.article_id is null then 'pending' when s.score is null then 'no-match' else 'scored' end as status,
      coalesce(s.topics, '{}') as topics,
      coalesce(s.takeaways, '{}') as takeaways, coalesce(s.reading, '[]') as reading,
      a.image, a.description, a.author, left(a.text, ${EXCERPT_CHARS}) as excerpt
    from articles a
    left join scores s on s.article_id = a.id
    left join articles c on c.id = a.covered_by
    where a.source in (select name from feeds where enabled)
      -- A story that another one was interpreted from shows inside that one, not twice.
      and not exists (select 1 from articles p where p.covered_by = a.id and p.source in (select name from feeds where enabled))
      and (${sort} = 'latest' or a.published_at > now() - interval '7 days')
      and (${filter}::text is null
        or (${filter} = 'no-match' and s.article_id is not null and s.score is null)
        or ${filter} = any(s.topics))
    order by case when ${sort} = 'relevance' then s.score end desc nulls last, a.published_at desc
    limit 50
  `;
  return rows as FeedItem[];
}

// The interests that matched a story this week, for the feed's filter chips.
export async function getFeedTopics(): Promise<string[]> {
  const rows = await sql`
    select distinct unnest(s.topics) as topic
    from scores s
    join articles a on a.id = s.article_id
    where a.published_at > now() - interval '7 days' and a.source in (select name from feeds where enabled)
    order by topic
  `;
  return rows.map((row) => row.topic as string);
}

export type FollowUp = { id: string; task: string; done: boolean; title: string; url: string; source: string };

export async function getFollowUps(): Promise<FollowUp[]> {
  return (await sql`
    select f.id::text, f.task, f.done, a.title, a.url, a.source
    from follow_ups f join articles a on a.id = f.article_id
    order by f.done, f.created_at desc
  `) as FollowUp[];
}

export async function countOpenFollowUps(): Promise<number> {
  const [row] = await sql`select count(*)::int as open from follow_ups where not done`;
  return row.open;
}

export async function addFollowUp(articleId: string, task: string) {
  task = task.trim();
  if (!task || task.length > 200) throw new Error("Invalid follow-up");
  // A cap keeps one person's list, and the table, a reasonable size.
  await sql`
    insert into follow_ups (article_id, task)
    select ${articleId}, ${task} where (select count(*) from follow_ups) < 500
  `;
}

export async function setFollowUpDone(id: string, done: boolean) {
  await sql`update follow_ups set done = ${done} where id = ${id}::bigint`;
}

export async function deleteFollowUp(id: string) {
  await sql`delete from follow_ups where id = ${id}::bigint`;
}
