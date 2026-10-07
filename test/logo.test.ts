import type { Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth, type TUI } from "@earendil-works/pi-tui";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  INTRO_TICK_MS,
  introLines,
  introTicks,
  playHotmilkIntro,
  renderHotmilkBanner,
  scaleBanner,
  type Paint,
} from "../src/ui/logo.ts";

const tag: Paint = (color, text) => `<${color}>${text}</${color}>`;
const plain = (line: string) => line.replace(/<\/?[a-zA-Z]+>/g, "");

describe("renderHotmilkBanner", () => {
  it("spells hotmilk in 5 equal-width block rows", () => {
    const lines = renderHotmilkBanner();

    expect(lines).toHaveLength(5);
    expect(new Set(lines.map((line) => line.length)).size).toBe(1);
    expect(lines[2]).toContain("█████");
  });
});

describe("scaleBanner", () => {
  it("doubles width and height and splits half blocks into clean top/bottom rows", () => {
    expect(scaleBanner(["▄█", "▀ "])).toEqual(["  ██", "████", "██  ", "    "]);
    const big = scaleBanner(renderHotmilkBanner());
    expect(big).toHaveLength(10);
    expect(big[0].length).toBe(renderHotmilkBanner()[0].length * 2);
  });
});

describe("introLines", () => {
  const solid = (lines: string[]) => lines.map(plain).join("").replace(/[^█▄▀]/g, "").length;
  const ink = (lines: string[]) => lines.map(plain).join("\n");

  it("fills the letters from the bottom: ink grows through the rise, bottom rows first", () => {
    const early = introLines(2, 120, tag);
    const late = introLines(19, 120, tag);
    expect(solid(early)).toBeGreaterThan(0);
    expect(solid(late)).toBeGreaterThan(solid(early));
    // The top banner row (after 2 steam rows) is still empty or only rippling at tick 2.
    expect(plain(early[2])).not.toMatch(/[█▄▀]/);
    // The ripple row sits right above the milk.
    expect(ink(early)).toMatch(/[∿~]/);
  });

  it("glints an accent band across a full banner, then lifts and collapses to nothing", () => {
    const glint = introLines(20 + 8, 120, tag);
    expect(glint.join("")).toContain("<accent>");
    const full = introLines(20, 120, tag);
    const lifted = introLines(introTicks(120) - 1, 120, tag);
    expect(lifted.length).toBeLessThan(full.length);
    expect(solid(lifted)).toBeLessThan(solid(full));
    expect(introLines(introTicks(120), 120, tag)).toEqual([]);
  });

  it("centers the banner and swaps to the 5-row banner when the terminal is too narrow", () => {
    const wide = introLines(20, 200, tag);
    expect(plain(wide[3]).search(/\S/)).toBeGreaterThan(20);
    const narrow = introLines(20, 60, tag);
    expect(narrow.length).toBeLessThan(wide.length);
    for (const line of narrow) expect(plain(line).length).toBeLessThanOrEqual(60);
  });
});

describe("playHotmilkIntro", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function place(hasUI = true, fg: Paint = tag) {
    const placements: { name: string; placement: string }[] = [];
    let widget: { render: (width: number) => string[]; dispose: () => void } | undefined;
    const renders = { count: 0 };
    const ctx = {
      hasUI,
      ui: {
        setWidget: (
          name: string,
          factory: (tui: TUI, theme: Theme) => { render: (width: number) => string[]; dispose: () => void },
          opts: { placement: string },
        ) => {
          placements.push({ name, placement: opts.placement });
          // SAFETY: the widget only calls tui.requestRender and theme.fg.
          widget = factory({ requestRender: () => renders.count++ } as never, { fg } as never);
        },
      },
    };
    // SAFETY: fake context implements only hasUI and ui.setWidget, the members the intro reads.
    playHotmilkIntro(ctx as never);
    return { placements, widget, renders };
  }

  it("plays above the editor, ends empty with its timer stopped, and stops on dispose", () => {
    vi.useFakeTimers();
    const { placements, widget, renders } = place();
    expect(placements).toEqual([{ name: "startup-intro", placement: "aboveEditor" }]);
    expect(widget!.render(120).length).toBeGreaterThan(0);

    vi.advanceTimersByTime(introTicks(120) * INTRO_TICK_MS);
    expect(widget!.render(120)).toEqual([]);
    const finished = renders.count;
    vi.advanceTimersByTime(10_000);
    expect(renders.count).toBe(finished);

    const second = place();
    second.widget!.dispose();
    const disposed = second.renders.count;
    vi.advanceTimersByTime(10_000);
    expect(second.renders.count).toBe(disposed);
  });

  it("fits narrow widths", () => {
    const { widget } = place(true, (_color, text) => text);
    for (const line of widget!.render(10)) expect(visibleWidth(line)).toBeLessThanOrEqual(10);
    widget!.dispose();
  });

  it("skips placement when the UI is unavailable", () => {
    expect(place(false).placements).toEqual([]);
  });
});
