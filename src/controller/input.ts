import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ExtensionContext } from "./context.ts";
import { openModeSettingsModal } from "./mode.ts";

const INTERRUPT_PREFIX = "/interrupt ";

function handleStopInput(ctx: ExtensionContext): void {
  if (!ctx.isIdle()) {
    ctx.abort();
    ctx.ui.notify("Stopped current work.", "warning");
    return;
  }
  ctx.ui.notify("No running work to stop.", "info");
}

function handleInterruptInput(
  interruptPrompt: string,
  pi: ExtensionAPI,
  ctx: ExtensionContext,
): void {
  if (!interruptPrompt) {
    ctx.ui.notify("Usage: /interrupt <prompt>", "warning");
    return;
  }

  pi.sendUserMessage(`[INTERRUPT] ${interruptPrompt}`, {
    deliverAs: "steer",
  });
  ctx.ui.notify("Interrupt prompt sent.", "info");
}

export function routeInputCommand(text: string, pi: ExtensionAPI, ctx: ExtensionContext): void {
  const normalizedText = text.trim();
  if (normalizedText === "/stop") {
    handleStopInput(ctx);
    return;
  }
  if (normalizedText.startsWith(INTERRUPT_PREFIX)) {
    const interruptPrompt = normalizedText.slice(INTERRUPT_PREFIX.length).trim();
    handleInterruptInput(interruptPrompt, pi, ctx);
    return;
  }
}

export function registerInputCommands(pi: ExtensionAPI): void {
  pi.registerCommand("stop", {
    description: "Stop current running work.",
    handler: async (_args, ctx) => {
      handleStopInput(ctx);
    },
  });

  pi.registerCommand("interrupt", {
    description: "Send an interrupt prompt to steer current work.",
    handler: async (args, ctx) => {
      handleInterruptInput(args.trim(), pi, ctx);
    },
  });

  pi.registerCommand("mode", {
    description: "Open mode selection modal for bundled extension toggles.",
    handler: async (_args, ctx) => {
      await openModeSettingsModal(ctx);
    },
  });
}
