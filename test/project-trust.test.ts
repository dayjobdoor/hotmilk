import type { ProjectTrustContext } from "@earendil-works/pi-coding-agent";
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
  it("delegates to Pi when mode is delegate", async () => {
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("delegate"),
      trustContext(true, vi.fn()),
      "/tmp/project",
    );
    expect(result).toEqual({ trusted: "undecided" });
  });

  it("auto-trusts when mode is always", async () => {
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("always", true),
      trustContext(false, vi.fn()),
      "/tmp/project",
    );
    expect(result).toEqual({ trusted: "yes", remember: true });
  });

  it("declines when mode is never", async () => {
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("never", true),
      trustContext(false, vi.fn()),
      "/tmp/project",
    );
    expect(result).toEqual({ trusted: "no", remember: true });
  });

  it("prompts when mode is prompt and UI is available", async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt"),
      trustContext(true, confirm),
      "/tmp/project",
    );
    expect(confirm).toHaveBeenCalledOnce();
    expect(result).toEqual({ trusted: "yes", remember: false });
  });

  it("passes remember preference through prompt approval", async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt", true),
      trustContext(true, confirm),
      "/tmp/project",
    );
    expect(result).toEqual({ trusted: "yes", remember: true });
  });

  it("declines prompt approval when the user rejects trust", async () => {
    const confirm = vi.fn().mockResolvedValue(false);
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt", true),
      trustContext(true, confirm),
      "/tmp/project",
    );
    expect(result).toEqual({ trusted: "no", remember: false });
  });

  it("defers to Pi when mode is prompt without UI", async () => {
    const result = await resolveProjectTrustDecision(
      resolvedProjectTrust("prompt"),
      trustContext(false, vi.fn()),
      "/tmp/project",
    );
    expect(result).toEqual({ trusted: "undecided" });
  });
});

describe("registerProjectTrustHandlers", () => {
  it("wires project_trust handler to resolveProjectTrustDecision", async () => {
    let handler:
      | ((event: { cwd: string }, ctx: ProjectTrustContext) => Promise<unknown>)
      | undefined;
    const pi = {
      on: (event: string, fn: typeof handler) => {
        if (event === "project_trust") handler = fn;
      },
    };

    registerProjectTrustHandlers(pi as never, resolvedProjectTrust("always", true));

    expect(handler).toEqual(expect.any(Function));
    const result = await handler!({ cwd: "/tmp/project" }, trustContext(false, vi.fn()));
    expect(result).toEqual({ trusted: "yes", remember: true });
  });
});
