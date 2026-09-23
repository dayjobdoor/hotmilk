/**
 * Vendored from pi-kanagawa 1.0.0 (MIT) — https://www.npmjs.com/package/pi-kanagawa
 * Changes vs upstream: @mariozechner/* imports rewritten to @earendil-works/*
 * (Pi virtualizes both specifiers at runtime). The duplicate /thinking
 * registration is stripped by the wrapper in ./kanagawa.ts.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

// ── Wave ─────────────────────────────────────────────────────────────────────
// Crests travel left→right, shrinking as they approach the right shore.
// Asymmetric wave profile: short steep rise (▃█), long gradual fall, small trough.
// Heights 0–7 at each position; peak is at rel=1.
// WAVE_PROFILE drives both the char and the color — easy to tune.
const WAVE_PROFILE  = [2, 7, 6, 5, 4, 3, 2, 1, 0]; // height at each rel position
const WAVE_PEAK_REL = 1;                              // rel index of the tallest point
const WAVE_LEN      = WAVE_PROFILE.length;            // 9
const WAVE_SPACING  = 11;   // wave (9) + trough (2) → ~10 crests on a 120-wide terminal
const WAVE_MS       = 60;

// height → block character
const HEIGHT_CHARS = ["▁","▂","▃","▄","▅","▆","▇","█"];

// Whole-wave color: each wave is uniformly colored by its current peak height.
// Tall waves (left) = deep blue. Shrinking toward shore = teal → white foam.
// Colors are the Kanagawa blues/whites from the theme:
//   crystalBlue (#7E9CD8) → waveAqua2 (#7AA89F) → waveAqua1 (#6A9589) → fujiWhite (#DCD7BA)
function waveColor(peakHeight: number): string {
  if (peakHeight <= 0) return "dim";          // sumiInk5   — flat/gone
  if (peakHeight <= 1) return "text";         // fujiWhite  — pure foam
  if (peakHeight <= 3) return "thinkingLow";  // waveAqua1  — shallow teal
  if (peakHeight <= 5) return "borderAccent"; // waveAqua2  — blue-teal
  return "mdLink";                            // crystalBlue — open water
}

function makeWaveComponent(offset: number) {
  return (_tui: any, theme: any) => ({
    render(width: number): string[] {
      let line = "";
      for (let x = 0; x < width; x++) {
        const rel = ((x - offset) % WAVE_SPACING + WAVE_SPACING) % WAVE_SPACING;
        if (rel < WAVE_LEN) {
          const peakX  = x - rel + WAVE_PEAK_REL;
          const scale  = Math.min(1, Math.max(0, 1 - peakX / width));
          const scaledH = Math.round(WAVE_PROFILE[rel] * scale);
          // Color driven by the wave's peak height — whole wave shifts together
          const peakH  = Math.round(WAVE_PROFILE[WAVE_PEAK_REL] * scale);
          line += theme.fg(waveColor(peakH), HEIGHT_CHARS[scaledH]);
        } else {
          line += theme.fg("dim", "▁");
        }
      }
      return [line];
    },
    invalidate() {},
  });
}

// ── Thinking levels ──────────────────────────────────────────────────────────
const THINKING_LEVELS = ["off","minimal","low","medium","high","xhigh"] as const;
type ThinkingLevel = typeof THINKING_LEVELS[number];

const THINKING_COLORS: Record<string, string> = {
  off:     "thinkingOff",
  minimal: "thinkingMinimal",
  low:     "thinkingLow",
  medium:  "thinkingMedium",
  high:    "thinkingHigh",
  xhigh:   "thinkingXhigh",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function shortModelName(raw: unknown): string {
  const id = typeof raw === "string" ? raw : (raw as any)?.id ?? String(raw ?? "");
  return id.split("/").pop() ?? id;
}

// ── Extension ─────────────────────────────────────────────────────────────────
export default function (pi: ExtensionAPI) {
  let model         = "";
  let thinkingLevel = "";
  let tokens        = 0;

  // Wave state — ui reference saved from session_start so setInterval can reach it
  let ui:         any                                    = null;
  let gitBranch:  string                                 = "";
  let waveTimer:  ReturnType<typeof setInterval> | null  = null;
  let waveOffset: number                                 = 0;

  function startWave() {
    if (waveTimer || !ui) return;
    // Hide git branch while wave runs
    ui.setWidget("git-branch", undefined);
    waveOffset = 0;
    // Render first frame immediately, then tick
    ui.setWidget("wave", makeWaveComponent(waveOffset), { placement: "belowEditor" });
    waveTimer = setInterval(() => {
      waveOffset = (waveOffset + 1) % WAVE_LEN;
      ui.setWidget("wave", makeWaveComponent(waveOffset), { placement: "belowEditor" });
    }, WAVE_MS);
  }

  function stopWave() {
    if (waveTimer) { clearInterval(waveTimer); waveTimer = null; }
    ui?.setWidget("wave", undefined);
    // Restore git branch
    if (ui && gitBranch) {
      ui.setWidget(
        "git-branch",
        (_tui: any, theme: any) => ({
          render(width: number): string[] {
            return [theme.fg("muted", truncateToWidth(` ⎇  ${gitBranch}`, width))];
          },
          invalidate() {},
        }),
        { placement: "belowEditor" }
      );
    }
  }

  // ── /thinking <level> command ─────────────────────────────────────────────
  pi.registerCommand("thinking", {
    description: "Set thinking level: off minimal low medium high xhigh",

    getArgumentCompletions(prefix: string) {
      return THINKING_LEVELS
        .filter(l => l.startsWith(prefix))
        .map(l => ({ value: l, label: l, description: `thinking: ${l}` }));
    },

    async handler(args: string, ctx: any) {
      const level = args.trim() as ThinkingLevel;
      if (!THINKING_LEVELS.includes(level)) {
        ctx.ui.notify(
          `Unknown level "${level}". Options: ${THINKING_LEVELS.join(", ")}`,
          "error"
        );
        return;
      }
      pi.setThinkingLevel(level);
      thinkingLevel = level;
    },
  });

  // ── @thinking:<level> inline interceptor ─────────────────────────────────
  // Type "@thinking:medium" anywhere in a message — switches level and strips tag.
  pi.on("input", async (event: any, _ctx: any) => {
    const match = (event.content ?? "").match(
      /@thinking:(off|minimal|low|medium|high|xhigh)/
    );
    if (!match) return;
    const level = match[1] as ThinkingLevel;
    pi.setThinkingLevel(level);
    thinkingLevel = level;
    const cleaned = event.content.replace(match[0], "").trim();
    return { content: cleaned };
  });

  // ── Session setup ─────────────────────────────────────────────────────────
  pi.on("session_start", async (event: any, ctx: any) => {
    ui = ctx.ui;
    thinkingLevel = pi.getThinkingLevel();

    // Git branch widget
    try {
      const result = await pi.exec("git", ["branch", "--show-current"], { cwd: ctx.cwd });
      gitBranch = (result?.stdout ?? "").trim();
      if (gitBranch) {
        ctx.ui.setWidget(
          "git-branch",
          (_tui: any, theme: any) => ({
            render(width: number): string[] {
              return [theme.fg("muted", truncateToWidth(` ⎇  ${gitBranch}`, width))];
            },
            invalidate() {},
          }),
          { placement: "belowEditor" }
        );
      }
    } catch {
      // Not a git repo — no widget
    }

    // Autocomplete: @thinking:<level> tag
    ctx.ui.addAutocompleteProvider((current: any) => ({
      async getSuggestions(lines: string[], line: number, col: number, options: any) {
        const before = (lines[line] ?? "").slice(0, col);
        const match  = before.match(/@thinking:(\w*)$/);
        if (!match) return current.getSuggestions(lines, line, col, options);
        const partial = match[1] ?? "";
        return {
          prefix: `@thinking:${partial}`,
          items: THINKING_LEVELS
            .filter(l => l.startsWith(partial))
            .map(l => ({
              value: `@thinking:${l}`,
              label: `@thinking:${l}`,
              description: `switch thinking to ${l} (stripped before send)`,
            })),
        };
      },
      applyCompletion(lines: string[], line: number, col: number, item: any, prefix: string) {
        return current.applyCompletion(lines, line, col, item, prefix);
      },
    }));

    // Footer: model │ ◈ thinking │ tokens
    ctx.ui.setFooter((_tui: any, theme: any) => ({
      render(width: number): string[] {
        const sep   = theme.fg("border", " │ ");
        const parts: string[] = [];

        if (model) {
          parts.push(theme.fg("accent", shortModelName(model)));
        }
        if (thinkingLevel) {
          parts.push(theme.fg(THINKING_COLORS[thinkingLevel] ?? "muted", `◈ ${thinkingLevel}`));
        }
        if (tokens > 0) {
          parts.push(theme.fg("muted", `${formatTokens(tokens)} tokens`));
        }

        if (parts.length === 0) return [];
        return [truncateToWidth(" " + parts.join(sep), width)];
      },
      invalidate() {},
    }));
  });

  // ── Wave lifecycle ────────────────────────────────────────────────────────
  pi.on("agent_start", async (_event: any, _ctx: any) => { startWave(); });
  pi.on("agent_end",   async (_event: any, _ctx: any) => { stopWave();  });

  // ── State sync ────────────────────────────────────────────────────────────
  pi.on("model_select", async (event: any, _ctx: any) => {
    model = shortModelName(event.model);
  });

  pi.on("before_agent_start", async (_event: any, _ctx: any) => {
    thinkingLevel = pi.getThinkingLevel();
  });

  pi.on("turn_end", async (_event: any, ctx: any) => {
    const usage = ctx.getContextUsage?.();
    if (usage) tokens = usage.tokens ?? 0;
  });
}
