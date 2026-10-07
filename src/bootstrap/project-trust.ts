import {
  CONFIG_DIR_NAME,
  type ExtensionAPI,
  type ProjectTrustContext,
  type ProjectTrustEventResult,
} from "@earendil-works/pi-coding-agent";
import type { ResolvedProjectTrust } from "../config/hotmilk.ts";

const HOTMILK_TRUST_PROMPT = (cwd: string): string =>
  `Trust this project for hotmilk?\n\n${cwd}\n\nEnables: ${CONFIG_DIR_NAME}/settings.json, project extensions, .agents/skills, gentle-ai files under ${CONFIG_DIR_NAME}/. Decline keeps global hotmilk bundles only.`;

/** Resolve the trust decision for a project from hotmilk `projectTrust` settings. */
export async function resolveProjectTrustDecision(
  settings: ResolvedProjectTrust,
  ctx: ProjectTrustContext,
  cwd: string,
): Promise<ProjectTrustEventResult> {
  if (settings.mode === "always") return { trusted: "yes", remember: settings.remember };
  if (settings.mode === "never") return { trusted: "no", remember: settings.remember };
  if (settings.mode !== "prompt" || !ctx.hasUI) return { trusted: "undecided" };
  const trusted = await ctx.ui.confirm(HOTMILK_TRUST_PROMPT(cwd), "Trust project");
  return trusted ? { trusted: "yes", remember: settings.remember } : { trusted: "no", remember: false };
}

/**
 * Register the Pi project-trust event handler.
 *
 * @param pi - Pi extension API
 * @param settings - resolved project trust settings
 */
export function registerProjectTrustHandlers(
  pi: ExtensionAPI,
  settings: ResolvedProjectTrust,
): void {
  pi.on("project_trust", (event, ctx) => resolveProjectTrustDecision(settings, ctx, event.cwd));
}
