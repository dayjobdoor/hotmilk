import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { openModeSettingsModal } from "./mode.ts";

/**
 * Handle /stop command input.
 *
 * @param ctx - extension context
 */
function handleStopInput(ctx: ExtensionContext): void {
  if (!ctx.isIdle()) {
    ctx.abort();
    ctx.ui.notify("Stopped current work.", "warning");
    return;
  }
  ctx.ui.notify("No running work to stop.", "info");
}

/**
 * Handle /interrupt command input.
 *
 * @param interruptPrompt - interrupt prompt text
 * @param pi - Pi extension API
 * @param ctx - extension context
 */
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

/** Pure: the user message a skill alias command sends (`/skill:<name> <args>`). */
export function skillAliasMessage(skill: string, args: string): string {
  const rest = args.trim();
  return rest ? `/skill:${skill} ${rest}` : `/skill:${skill}`;
}

/**
 * Register `/<skill>` as a thin alias for `/skill:<skill>` (ponytail's pattern):
 * behavior stays in the skill's markdown, the command only forwards.
 */
function registerSkillAlias(pi: ExtensionAPI, skill: string, description: string): void {
  pi.registerCommand(skill, {
    description,
    handler: async (args, ctx) => {
      const message = skillAliasMessage(skill, args);
      if (!ctx.isIdle()) {
        pi.sendUserMessage(message, { deliverAs: "followUp" });
        ctx.ui.notify(`${message} queued as follow-up.`, "info");
        return;
      }
      pi.sendUserMessage(message);
    },
  });
}

/** Register `/stop`, `/interrupt`, `/mode`, and the `/pioneer` skill alias as Pi commands. */
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
    description: "Open mode selection modal for persona and bundled extension toggles.",
    handler: async (_args, ctx) => {
      await openModeSettingsModal(ctx);
    },
  });

  registerSkillAlias(pi, "pioneer", "Run /skill:pioneer (roadmap-anchored W-model change flow).");
}
