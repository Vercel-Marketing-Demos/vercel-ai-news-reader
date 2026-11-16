import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";

// Your team's AI Gateway credits, read with this deployment's own OIDC token, so there's no key to
// set up. Null when they can't be read, as in local development without `vercel env pull`.
export async function getCredits(): Promise<{ balance: number; used: number } | null> {
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
      headers: { Authorization: `Bearer ${await getVercelOidcToken()}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const { balance, total_used } = await response.json();
    return { balance: Number(balance), used: Number(total_used) };
  } catch {
    return null;
  }
}
