import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";

/** Session-start banner (figlet small, "hotmilk"). */
export const HOTMILK_LOGO = [
  " _        _         _ _ _   ",
  "| |_  ___| |_ _ __ (_) | |__",
  "| ' \\/ _ \\  _| '  \\| | | / /",
  "|_||_\\___/\\__|_|_|_|_|_|_\\_\\",
].join("\n");

const LOGO_LINES = HOTMILK_LOGO.split("\n");
/** Same lead time as gentle-pi `startup-banner.ts`. */
const LOGO_SHOW_DELAY_MS = 50;

/** Timeout handle for delayed logo display. */
let showTimeout: ReturnType<typeof setTimeout> | undefined;
/** Active TUI instance for logo rendering. */
let activeTui: TUI | undefined;

/**
 * Center fixed-width ASCII lines within the terminal width.
 *
 * @param lines - ASCII lines to center
 * @param width - terminal width
 * @returns centered lines
 */
export function centerAsciiLines(lines: readonly string[], width: number): string[] {
  const contentWidth = Math.max(...lines.map((line) => line.length), 1);
  const pad = Math.max(0, Math.floor((width - contentWidth) / 2));
  const prefix = " ".repeat(pad);
  return lines.map((line) => prefix + line.padEnd(contentWidth));
}

/**
 * Skip only `/reload`; show on fresh launch and session resume (gentle-pi shows every session_start).
 *
 * @param reason - session start reason
 * @returns true if logo should be shown
 */
export function shouldShowSessionLogo(reason: string): boolean {
  return reason !== "reload";
}

/** Clear any pending logo display timers. */
function clearLogoTimers(): void {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = undefined;
  }
}

/**
 * Dismiss the hotmilk logo from the header.
 *
 * @param ctx - extension context
 */
function dismissHotmilkLogo(ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;
  ctx.ui.setHeader(undefined);
  activeTui?.requestRender();
  activeTui = undefined;
}

/**
 * Show the hotmilk session logo with a delay.
 *
 * @param ctx - extension context
 */
function showHotmilkSessionLogo(ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;

  clearLogoTimers();
  showTimeout = setTimeout(() => {
    showTimeout = undefined;
    if (!ctx.hasUI) return;

    ctx.ui.setHeader((tui, theme) => {
      activeTui = tui;
      return {
        render(width: number): string[] {
          return centerAsciiLines(LOGO_LINES, width).map((line) => theme.fg("accent", line));
        },
        invalidate() {
          clearLogoTimers();
        },
      };
    });
  }, LOGO_SHOW_DELAY_MS);
}

/**
 * Register persistent header logo on session start; clear on shutdown only.
 *
 * @param pi - Pi extension API
 */
export function registerHotmilkSessionLogo(pi: ExtensionAPI): void {
  pi.on("session_start", (event, ctx) => {
    if (!shouldShowSessionLogo(event.reason)) return;
    showHotmilkSessionLogo(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    clearLogoTimers();
    dismissHotmilkLogo(ctx);
  });
}
