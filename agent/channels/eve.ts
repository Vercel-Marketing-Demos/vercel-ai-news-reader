import { neon } from "@neondatabase/serverless";
import { type AuthFn, ForbiddenError, none } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

// The chat the web app's Ask Signal panel talks to, at /eve/v1. Anyone with the link can use it, on
// the AI Gateway credits of whoever deployed this Signal. Each conversation stops at $0.50 (agent.ts),
// and this caps how many start each day, so a shared link can't run up a bill. For a hard limit on
// all of Signal's AI spend, set an AI Gateway budget for the project.
const CONVERSATIONS_PER_DAY = 30;
const anyone = none<Request>();

const dailyCap: AuthFn<Request> = async (request) => {
  // A new conversation is a POST to /eve/v1/session; messages in it go to /eve/v1/session/:id.
  if (request.method === "POST" && /\/eve\/v1\/session\/?$/.test(new URL(request.url).pathname)) {
    const sql = neon(process.env.DATABASE_URL!);
    const [started] = await sql`
      insert into chat_days (day, conversations) values (current_date, 1)
      on conflict (day) do update set conversations = chat_days.conversations + 1
        where chat_days.conversations < ${CONVERSATIONS_PER_DAY}
      returning conversations
    `;
    if (!started) {
      throw new ForbiddenError({
        code: "daily_limit",
        message: `Ask Signal has had its ${CONVERSATIONS_PER_DAY} conversations for today. It's back tomorrow.`,
      });
    }
  }
  return anyone(request);
};

export default eveChannel({ auth: [dailyCap] });
