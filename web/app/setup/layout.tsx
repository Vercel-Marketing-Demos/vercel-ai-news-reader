import { connection } from "next/server";
import { getProfile } from "@/lib/db";
import { ThemeSwitch } from "../theme";
import { SetupTabs } from "./tabs";

// Setup in three tabs: what you care about, where Signal looks, and how it all works and what it
// costs. Until you've said what you care about, it's a welcome instead, with no tabs to wander off to.
export default async function SetupLayout({ children }: LayoutProps<"/setup">) {
  await connection(); // your saved choices as they are now
  if (!(await getProfile())) return <section className="max-w-3xl">{children}</section>;
  return (
    <section className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Setup</h1>
        <ThemeSwitch />
      </div>
      <SetupTabs />
      <div className="mt-8">{children}</div>
    </section>
  );
}
