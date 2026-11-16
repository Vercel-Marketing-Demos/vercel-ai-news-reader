import { getCredits } from "@/lib/credits";
import { parts, type PartName } from "@/lib/xray";

export const metadata = { title: "How it works · Signal" };

// What happens to each story once you've said what you care about, and the part of Vercel behind each step.
const STEPS: { text: string; part: PartName }[] = [
  { text: "Every 15 minutes, the scorer scans the sources you turned on and reads each new article.", part: "daemon" },
  { text: "It saves each article to Postgres.", part: "neon" },
  { text: "A small embedding model keeps the articles that match your interests, and an LLM scores them and says why they matter.", part: "gateway" },
  { text: "The feed renders on the server and checks for new scores every 5 seconds.", part: "web" },
  { text: "When you change your interests, the web app calls the private Python service…", part: "api" },
  { text: "…which queues a rescore for the scorer to pick up.", part: "queue" },
];

export default async function HowItWorksPage() {
  return (
    <>
      <Spend credits={await getCredits()} />

      <h2 className="mt-10 font-medium">How Signal works</h2>
      <p className="mt-1 text-sm text-muted">
        One Vercel project: a Next.js app, a private Python API, an always-on Python worker, an AI agent, and a
        Postgres database, all deployed together from one git push.
      </p>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs">
              {index + 1}
            </span>
            <p>
              {step.text} <span className="text-sm text-accent">{parts[step.part].name}</span>
            </p>
          </li>
        ))}
      </ol>
      <a href="/xray" className="mt-6 inline-block text-sm text-accent hover:underline">
        See every part in X-ray →
      </a>
    </>
  );
}

// Anyone with the link can use this Signal, on its owner's Vercel account. Say so, show what's left,
// and point to the place to cap it: an AI Gateway budget, set where the owner is signed in to Vercel.
function Spend({ credits }: { credits: Awaited<ReturnType<typeof getCredits>> }) {
  const project = process.env.VERCEL_PROJECT_ID ?? "your-project";
  return (
    <div className="rounded-xl border border-line p-5 text-sm">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">Your Signal runs on your Vercel account</span>
        {credits && (
          <span className="text-muted">
            AI credits left: <span className="font-semibold text-foreground">${credits.balance.toFixed(2)}</span>
          </span>
        )}
      </p>
      <p className="mt-2 text-muted">
        Anyone with this link can read your feed, change Setup and chat with Ask Signal, and what they do is charged
        to your account. To share Signal, show people the QR code in X-ray&apos;s Share tab so they get their own.
      </p>
      <p className="mt-3 text-muted">
        Cap what it can spend with an{" "}
        <a
          href="https://vercel.com/docs/ai-gateway/observability-and-spend/budgets"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2"
        >
          AI Gateway budget
        </a>
        :
      </p>
      <code className="mt-2 block overflow-x-auto rounded-md bg-surface px-3 py-2 font-mono text-xs whitespace-nowrap">
        vercel ai-gateway budgets set project {project} --amount 10 --refresh-period monthly
      </code>
    </div>
  );
}
