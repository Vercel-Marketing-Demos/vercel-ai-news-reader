import Image, { type StaticImageData } from "next/image";
import overview from "./dashboard/overview.png";
import deployments from "./dashboard/deployments.png";
import cdn from "./dashboard/cdn.png";
import firewall from "./dashboard/firewall.png";
import bots from "./dashboard/bots.png";
import daemon from "./dashboard/daemon.png";
import gateway from "./dashboard/gateway.png";

// Signal's own Vercel dashboard, screen by screen: the real project that runs this page, with what
// each part does for Signal. The screenshots are served as they are (`unoptimized`): this project's
// services routing doesn't reach Next's image optimizer, and they're already sized for the page.
const SCREENS: { title: string; text: string; href: string; image: StaticImageData; alt: string }[] = [
  {
    title: "One project for the whole app",
    text: "The site, a private Python API, the agent and the scorer run side by side as Vercel Services in one project. They reach each other through service bindings, with no public URLs or keys between them: saving interests calls the Python API, which hands the rescore to a queue. Every merge to main becomes production, and Instant Rollback puts the previous one back in a click.",
    href: "https://vercel.com/docs/services",
    image: overview,
    alt: "The project overview: the production deployment, its domain, the commit it came from, and Instant Rollback",
  },
  {
    title: "A preview for every pull request",
    text: "One git push builds and deploys all four services together. Every pull request gets its own preview, with its own copy of the database, in under a minute. Merge it, and that build becomes production. There's no CI to set up.",
    href: "https://vercel.com/docs/deployments/preview-deployments",
    image: deployments,
    alt: "The deployments list: preview builds for each branch and production builds for each merge to main, each ready in under a minute",
  },
  {
    title: "Served from the nearest region",
    text: "Every request lands on Vercel's global network first, in the region closest to the visitor, before it reaches the app. Fast everywhere, with nothing to set up.",
    href: "https://vercel.com/docs/cdn",
    image: cdn,
    alt: "The CDN map: requests by Vercel region around the world",
  },
  {
    title: "A firewall that's on by default",
    text: "DDoS mitigation and system rules filter traffic before it reaches the app, and the dashboard shows what was allowed, denied, or challenged.",
    href: "https://vercel.com/docs/vercel-firewall",
    image: firewall,
    alt: "The Firewall: active, with requests allowed, denied and challenged over two weeks",
  },
  {
    title: "Know which traffic is bots",
    text: "Bot Management shows how much traffic comes from bots, verified or not, and lets you block AI crawlers or turn on BotID with one setting.",
    href: "https://vercel.com/docs/bot-management",
    image: bots,
    alt: "Bot Management: the share of bot traffic, verified bots, and settings for bot protection, AI bots and BotID",
  },
  {
    title: "An always-on worker",
    text: "The scorer runs as a daemon: one always-on instance that scans the news every 15 minutes. Its CPU, memory and logs sit in the same dashboard as the site, and logs from every service land in one place, with each conversation with the agent traced in Agent Runs.",
    href: "https://vercel.com/docs/daemons",
    image: daemon,
    alt: "The scorer daemon: one ready instance, its CPU, memory and data transfer, and its live scan logs",
  },
  {
    title: "Every model call, accounted for",
    text: "Scoring and Ask Signal both go through AI Gateway, so spend, speed and tokens are tracked by model, against your credits and the budget you set.",
    href: "https://vercel.com/docs/ai-gateway",
    image: gateway,
    alt: "AI Gateway usage: spend, time to first token, requests and tokens by model, and the credit balance",
  },
];

export function Dashboard() {
  return (
    <section className="page-column">
      <h2 className="font-serif text-3xl font-medium tracking-tight">Inside Signal&apos;s Vercel dashboard</h2>
      <p className="mt-2 max-w-2xl text-muted">The real project that runs this page, screen by screen.</p>
      <ol className="mt-10 space-y-16">
        {SCREENS.map((screen, index) => (
          <li key={screen.title} className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
            <div className="lg:pt-2">
              <p className="text-xs font-medium text-muted">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 font-medium">{screen.title}</h3>
              <p className="mt-2 text-sm text-muted">{screen.text}</p>
              <a href={screen.href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm hover:underline">
                Learn more →
              </a>
            </div>
            <Image
              src={screen.image}
              alt={screen.alt}
              unoptimized
              placeholder="blur"
              className="h-auto w-full rounded-xl border border-line"
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
