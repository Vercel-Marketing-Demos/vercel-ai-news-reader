import { redirect } from "next/navigation";
import { getProfile, saveProfile } from "@/lib/db";
import { requestRescore } from "@/lib/backend";

export const metadata = { title: "Setup · Signal" };

const TOPICS = [
  "AI agents",
  "LLM pricing",
  "GPUs and chips",
  "Developer tools",
  "Vercel and Next.js",
  "Open-source models",
  "AI regulation",
  "Startup funding",
  "Security",
  "Robotics",
];

// Saving rescores recent stories, so changes are limited to one every 15 minutes. The first save
// always goes through: it's what turns on scoring.
async function save(formData: FormData) {
  "use server";
  let changed = false;
  try {
    changed = await saveProfile({
      about: String(formData.get("about")).trim(),
      topics: formData.getAll("topic").map(String),
    });
  } catch {
    redirect("/setup?wait=1");
  }
  if (changed) await requestRescore();
  redirect("/");
}

// What you care about, in your own words, and topics to tag it with. On a new Signal this is the
// first thing you see: nothing is scored until you've written something.
export default async function InterestsPage({ searchParams }: PageProps<"/setup">) {
  const [profile, { wait }] = await Promise.all([getProfile(), searchParams]);
  const welcome = !profile;
  return (
    <>
      {welcome && (
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-medium tracking-tight">Welcome to Signal</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Tell it what you care about, and it reads the news for you: every story scored against your own words, with
            a line on why it matters to you.
          </p>
        </div>
      )}
      {wait && (
        <p className="mb-6 rounded-lg bg-surface px-4 py-3 text-sm">
          Your interests weren&apos;t saved: they can change once every 15 minutes.
        </p>
      )}

      <form action={save}>
        <h2 className="font-medium">What do you care about?</h2>
        <p className="mt-1 text-sm text-muted">Say it in a sentence or two. Signal reads every story with this in mind.</p>
        <textarea
          name="about"
          required
          maxLength={2000}
          rows={8}
          defaultValue={profile?.about}
          placeholder="I want to use AI to help my team ship faster, and stay on top of new models worth trying."
          // Starts roomy, and grows with what you write where the browser supports it.
          className="mt-3 min-h-48 w-full rounded-lg border border-line bg-transparent p-3 leading-relaxed outline-none [field-sizing:content] focus:border-accent"
        />

        <h2 className="mt-8 font-medium">
          Topics{welcome && <span className="font-normal text-muted"> (optional)</span>}
        </h2>
        <p className="mt-1 text-sm text-muted">Quick tags that sharpen the scores, label stories, and filter your feed.</p>
        <Chips name="topic" options={TOPICS.map((topic) => [topic, profile?.topics.includes(topic) ?? false])} />

        <button type="submit" className="mt-10 rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90">
          {welcome ? "Show my feed" : "Save interests"}
        </button>
      </form>
    </>
  );
}

// Checkboxes styled as pills. Each checked one is submitted under `name`.
function Chips({ name, options }: { name: string; options: [string, boolean][] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map(([value, checked]) => (
        <label key={value}>
          <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
          <span className="block cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            {value}
          </span>
        </label>
      ))}
    </div>
  );
}
