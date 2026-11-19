"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

// Swipe, scroll, or use the tabs. The slide in view gets data-active, which plays its animations.
export function Slides({ titles, children }: { titles: string[]; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const slides = [...track.current!.children];
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(slides.indexOf(entry.target))),
      { root: track.current, threshold: 0.6 },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  const show = (index: number) => {
    setActive(index);
    track.current!.children[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <>
      <div className="page-column">
        <div role="tablist" className="mt-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-surface p-1 text-sm [scrollbar-width:none]">
          {titles.map((title, index) => (
            <button
              key={title}
              role="tab"
              aria-selected={index === active}
              onClick={() => show(index)}
              className="shrink-0 rounded-md px-3 py-1.5 whitespace-nowrap text-muted hover:text-foreground aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm"
            >
              {index + 1}. {title}
            </button>
          ))}
        </div>
      </div>
      <div ref={track} className="mt-6 flex snap-x snap-mandatory items-start overflow-x-auto [scrollbar-width:none]">
        {Children.map(children, (slide, index) => (
          // Slides sit side by side, so the row is as tall as its tallest slide. The ones not in view are
          // held to a screen's height, so a long slide doesn't leave the short ones trailing blank space.
          <section
            data-active={index === active || undefined}
            className="w-full shrink-0 snap-start not-data-active:max-h-svh not-data-active:overflow-hidden"
          >
            {slide}
          </section>
        ))}
      </div>
    </>
  );
}
