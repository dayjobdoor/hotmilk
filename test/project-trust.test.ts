import type { ProjectTrustContext, ProjectTrustEventResult } from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  registerProjectTrustHandlers,
  resolveProjectTrustDecision,
} from "../src/bootstrap/project-trust.ts";
import type { ResolvedProjectTrust } from "../src/config/hotmilk.ts";

function resolvedProjectTrust(
  mode: ResolvedProjectTrust["mode"],
  remember = false,
): ResolvedProjectTrust {
  return { mode, remember };
}

function trustContext(hasUI: boolean, confirm: () => Promise<boolean>): ProjectTrustContext {
  return {
    cwd: "/tmp/project",
    mode: "tui",
    hasUI,
    ui: {
      confirm,
      input: async () => "",
      notify: () => {},
      select: async () => "",
    },
  };
}

describe("resolveProjectTrustDecision", () => {
  it.each([
    ["delegate", false, { trusted: "undecided" }],
    ["always", true, { trusted: "yes", remember: true }],
    ["never", true, { trusted: "no", remember: true }],
  ] as const)("resolves %s mode to %j", async (mode, remember, expected) => {
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust(mode, remember),
      trustContext(false, vi.fn()),
      "/tmp/project",
    );
    expect(result).toEqual(expected);
  });

  it("prompt mode asks once via UI and defers to Pi without UI", async () => {
    const approvedConfirm = vi.fn().mockResolvedValue(true);
    const approved = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt"),
      trustContext(true, approvedConfirm),
      "/tmp/project",
    );
    expect(approvedConfirm).toHaveBeenCalledOnce();
    expect(approved).toEqual({ trusted: "yes", remember: false });

    const remembered = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt", true),
      trustContext(true, approvedConfirm),
      "/tmp/project",
    );
    expect(remembered).toEqual({ trusted: "yes", remember: true });

    const declinedConfirm = vi.fn().mockResolvedValue(false);
    const declined = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt", true),
      trustContext(true, declinedConfirm),
      "/tmp/project",
    );
    expect(declinedConfirm).toHaveBeenCalledOnce();
    expect(declined).toEqual({ trusted: "no", remember: false });

    const noUiConfirm = vi.fn();
    const deferred = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt"),
      trustContext(false, noUiConfirm),
      "/tmp/project",
    );
    expect(noUiConfirm).not.toHaveBeenCalled();
    expect(deferred).toEqual({ trusted: "undecided" });
  });
});

describe("registerProjectTrustHandlers", () => {
  it("registers a project_trust handler that applies settings", async () => {
    type ProjectTrustHandler = (
      event: { cwd: string },
      ctx: ProjectTrustContext,
    ) => Promise<ProjectTrustEventResult>;
    let handler: ProjectTrustHandler | undefined;
    const pi = {
      on(_event: "project_trust", next: ProjectTrustHandler) {
        handler = next;
      },
    };

    // SAFETY: test double implements only the project_trust registration hook.
    registerProjectTrustHandlers(pi as never, resolvedProjectTrust("always", true));

    expect(handler).toEqual(expect.any(Function));
    const result = await handler!({ cwd: "/tmp/project" }, trustContext(false, vi.fn()));
    expect(result).toEqual({ trusted: "yes", remember: true });
  });
});
