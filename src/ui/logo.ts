import type { ExtensionContext, Theme, ThemeColor } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, type TUI } from "@earendil-works/pi-tui";

/** Colors one run of text through a theme role (`theme.fg`, or a test double). */
export type Paint = (color: ThemeColor, text: string) => string;

// ── Banner glyphs ────────────────────────────────────────────────────────────

/** 5-row block glyphs used to spell the banner. */
const BANNER_LETTERS = {
  h: ["█   █", "█   █", "█████", "█   █", "█   █"],
  o: ["▄███▄", "█   █", "█   █", "█   █", "▀███▀"],
  t: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  m: ["█▄ ▄█", "█ █ █", "█ █ █", "█ █ █", "█ █ █"],
  i: ["███", " █ ", " █ ", " █ ", "███"],
  l: ["█  ", "█  ", "█  ", "█  ", "███"],
  k: ["█  █", "█ █ ", "██  ", "█ █ ", "█  █"],
} as const;

/** Render the block banner spelling `text` (a-z only) as 5 equal-width rows. */
export function renderHotmilkBanner(text = "hotmilk"): string[] {
  const rows: string[] = ["", "", "", "", ""];
  for (const char of text) {
    // SAFETY: the banner only spells glyphs defined in this map.
    const glyph = BANNER_LETTERS[char as keyof typeof BANNER_LETTERS];
    if (!glyph) continue;
    const width = Math.max(...glyph.map((row) => row.length));
    for (let row = 0; row < 5; row++) {
      rows[row] += `${(glyph[row] ?? "").padEnd(width, " ")} `;
    }
  }
  return rows;
}

// ── Startup intro: milk rises through the banner, a heat glint sweeps it, steam lifts it away ──

/** Top/bottom halves of one glyph cell when the banner is scaled 2× vertically. */
function splitHalves(char: string): readonly [string, string] {
  switch (char) {
    case "▄":
      return [" ", "█"];
    case "▀":
      return ["█", " "];
    default:
      return [char, char];
  }
}

/** Pure: scale block rows 2× (each cell becomes 2 columns × 2 rows; half blocks split cleanly). */
export function scaleBanner(rows: readonly string[]): string[] {
  return rows.flatMap((row) =>
    [0, 1].map((half) => Array.from(row, (char) => (splitHalves(char)[half] ?? char).repeat(2)).join("")),
  );
}

/** Pad block rows to one width so columns line up. */
function squareUp(rows: readonly string[]): string[] {
  const width = Math.max(...rows.map((row) => row.trimEnd().length));
  return rows.map((row) => row.trimEnd().padEnd(width, " "));
}

const SMALL_BANNER = squareUp(renderHotmilkBanner());
const BIG_BANNER = squareUp(scaleBanner(SMALL_BANNER));
const BIG_WIDTH = BIG_BANNER[0]?.length ?? 0;

/** Intro frame interval; the timer stops once {@link introTicks} frames have played. */
export const INTRO_TICK_MS = 50;
/** Frames the milk takes to fill the banner from the bottom. */
const RISE_TICKS = 20;
/** Frames the heat glint takes to cross the banner. */
const SWEEP_TICKS = 16;
const SWEEP_BAND = 6;
/** Blank rows above the banner that carry the steam. */
const STEAM_ROWS = 2;
const WAVE = "∿∿∿  ";

/** The 2× banner when it fits the terminal, else the 5-row one (cut off at the edge on very narrow terminals). */
function bannerFor(width: number): readonly string[] {
  return width >= BIG_WIDTH ? BIG_BANNER : SMALL_BANNER;
}

/** Pure: frames the whole intro plays for this render width (rise, glint, then the collapse). */
export function introTicks(width: number): number {
  return RISE_TICKS + SWEEP_TICKS + bannerFor(width).length + STEAM_ROWS + 1;
}

/** Paint `row` column by column; consecutive columns with the same role share one color run. */
function paintColumns(row: string, roleAt: (col: number) => ThemeColor | null, paint: Paint): string {
  let out = "";
  let run = "";
  let runRole: ThemeColor | null = null;
  const flush = () => {
    if (run) out += runRole ? paint(runRole, run) : run;
    run = "";
  };
  for (let col = 0; col < row.length; col++) {
    const role = roleAt(col);
    if (role !== runRole) {
      flush();
      runRole = role;
    }
    run += row[col];
  }
  flush();
  return out.trimEnd();
}

/**
 * Pure: one intro frame for a render `width`, centered, `[]` once finished.
 * 1. Rise: milk fills the block letters from the bottom; the surface row ripples
 *    (`accent` `∿`/`~`) one row above the fill. A `dim` wave runs under the banner.
 * 2. Glint: an `accent` band sweeps left to right and `dim` steam drifts above.
 * 3. Lift: everything turns `dim` and collapses upward row by row.
 */
export function introLines(tick: number, width: number, paint: Paint): string[] {
  const rows = bannerFor(width);
  const height = rows.length;
  const bannerWidth = rows[0]?.length ?? 0;
  const pad = Math.max(0, Math.floor((width - bannerWidth) / 2));
  const frameRows = height + STEAM_ROWS + 1;
  const glintTick = tick - RISE_TICKS;
  const liftTick = glintTick - SWEEP_TICKS;
  if (liftTick >= frameRows) return [];

  const lifting = liftTick >= 0;
  const level = tick < RISE_TICKS ? Math.floor(((tick + 1) * height) / RISE_TICKS) : height;
  const bandLeft =
    glintTick >= 0 && !lifting
      ? Math.floor((glintTick * (bannerWidth + SWEEP_BAND)) / SWEEP_TICKS) - SWEEP_BAND
      : Number.NEGATIVE_INFINITY;
  const milk: ThemeColor = lifting ? "dim" : "text";
  const inBand = (col: number) => col >= bandLeft && col < bandLeft + SWEEP_BAND;
  const line = (content: string, roleAt: (col: number) => ThemeColor) =>
    paintColumns(" ".repeat(pad) + content, (col) => (col < pad ? null : roleAt(col - pad)), paint);

  const steam = Array.from({ length: STEAM_ROWS }, (_, row) =>
    line(
      Array.from({ length: bannerWidth }, (_, col) =>
        tick >= RISE_TICKS && (col - (tick >> 1) + row * 4) % 9 === 0 ? "∿" : " ",
      ).join(""),
      () => "dim",
    ),
  );
  const banner = rows.map((row, index) => {
    if (index >= height - level) return line(row, (col) => (inBand(col) ? "accent" : milk));
    if (index === height - level - 1) {
      return line(
        Array.from(row, (char, col) => (char === " " ? " " : (col + tick) % 2 ? "∿" : "~")).join(""),
        () => "accent",
      );
    }
    return "";
  });
  const wave = line(
    Array.from({ length: bannerWidth }, (_, col) => WAVE[(col + tick) % WAVE.length]).join(""),
    () => "dim",
  );
  return [...steam, ...banner, wave].slice(Math.max(0, liftTick));
}

// ── Widget ───────────────────────────────────────────────────────────────────

/**
 * Play the startup intro in a widget above the editor: the banner is centered on the
 * render width and animates at {@link INTRO_TICK_MS} for {@link introTicks} frames, then
 * the widget renders nothing and its timer stops. Skipped without UI. Call on session
 * `startup` only; it shows beside kanagawa too, which uses the footer and `belowEditor`
 * widgets and never `aboveEditor`.
 */
export function playHotmilkIntro(ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;
  ctx.ui.setWidget(
    "startup-intro",
    (tui: TUI, theme: Theme) => {
      const paint: Paint = (color, text) => theme.fg(color, text);
      // The frame count depends on the render width; until the first render, assume a wide terminal.
      let width = BIG_WIDTH;
      let tick = 0;
      const timer = setInterval(() => {
        tick += 1;
        if (tick >= introTicks(width)) clearInterval(timer);
        tui.requestRender();
      }, INTRO_TICK_MS);
      return {
        render(renderWidth: number): string[] {
          width = renderWidth;
          return introLines(tick, renderWidth, paint).map((line) => truncateToWidth(line, renderWidth));
        },
        invalidate() {},
        dispose() {
          clearInterval(timer);
        },
      };
    },
    { placement: "aboveEditor" },
  );
}
