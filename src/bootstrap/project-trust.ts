import type {
  ExtensionAPI,
  ProjectTrustContext,
  ProjectTrustEventResult,
} from "@earendil-works/pi-coding-agent";
import type { ResolvedProjectTrust } from "../config/hotmilk.ts";

const HOTMILK_TRUST_PROMPT = (cwd: string): string =>
  `Trust this project for hotmilk?\n\n${cwd}\n\nEnables: .pi/settings.json, project extensions, .agents/skills, gentle-ai files under .pi/. Decline keeps global hotmilk bundles only.`;

export function resolveProjectTrustDecision(
  settings: ResolvedProjectTrust,
  ctx: ProjectTrustContext,
  cwd: string,
): Promise<ProjectTrustEventResult> {
  switch (settings.mode) {
    case "always":
      return Promise.resolve({ trusted: "yes", remember: settings.remember });
    case "never":
      return Promise.resolve({ trusted: "no", remember: settings.remember });
    case "prompt":
      if (!ctx.hasUI) {
        return Promise.resolve({ trusted: "undecided" });
      }
      return ctx.ui.confirm(HOTMILK_TRUST_PROMPT(cwd), "Trust project").then((trusted) => ({
        trusted: trusted ? "yes" : "no",
        remember: trusted ? settings.remember : false,
      }));
    default:
      return Promise.resolve({ trusted: "undecided" });
  }
}

export function registerProjectTrustHandlers(
  pi: ExtensionAPI,
  settings: ResolvedProjectTrust,
): void {
  pi.on("project_trust", async (event, ctx): Promise<ProjectTrustEventResult> => {
    return resolveProjectTrustDecision(settings, ctx, event.cwd);
  });
}
