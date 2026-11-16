import { getSources, setSourceEnabled } from "@/lib/db";
import { SourceSwitches } from "./switches";

export const metadata = { title: "Sources · Signal" };

// Each switch saves as you flip it. Sources cost nothing to change, unlike interests.
async function toggle(name: string, enabled: boolean) {
  "use server";
  if (typeof name !== "string" || typeof enabled !== "boolean") throw new Error("Invalid source");
  await setSourceEnabled(name, enabled);
}

export default async function SourcesPage() {
  return <SourceSwitches sources={await getSources()} toggle={toggle} />;
}
