import { cookies } from "next/headers";

// Your theme is a cookie, read on the server, so pages render in the right colors with no flash
// and no client JavaScript. Without the cookie, Signal is light.
const THEMES = ["light", "dark", "system"] as const;

export async function getTheme() {
  const theme = (await cookies()).get("theme")?.value;
  return theme === "dark" || theme === "system" ? theme : "light";
}

async function setTheme(formData: FormData) {
  "use server";
  const theme = formData.get("theme");
  const jar = await cookies();
  if (theme === "dark" || theme === "system") jar.set("theme", theme, { maxAge: 60 * 60 * 24 * 365 });
  else jar.delete("theme");
}

export async function ThemeSwitch() {
  const current = await getTheme();
  return (
    <form action={setTheme} className="flex rounded-full border border-line p-0.5 text-xs">
      {THEMES.map((theme) => (
        <button
          key={theme}
          name="theme"
          value={theme}
          aria-pressed={theme === current}
          className="rounded-full px-2.5 py-1 capitalize text-muted hover:text-foreground aria-pressed:bg-surface aria-pressed:text-foreground"
        >
          {theme}
        </button>
      ))}
    </form>
  );
}
