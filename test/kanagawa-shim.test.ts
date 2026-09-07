import { describe, expect, it } from "vite-plus/test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerBundledExtensionWithoutThinkingCommand } from "../src/bundled/kanagawa.ts";

type RegisterCommandPi = Pick<ExtensionAPI, "registerCommand">;

function registerCommandPi(commands: string[]): ExtensionAPI {
  const pi: RegisterCommandPi = {
    registerCommand(name) {
      commands.push(name);
    },
  };
  // SAFETY: test double; shim only calls registerCommand on this object.
  return pi as ExtensionAPI;
}

describe("kanagawa shim", () => {
  it("skips duplicate /thinking command registration", async () => {
    const commands: string[] = [];
    const pi = registerCommandPi(commands);

    await registerBundledExtensionWithoutThinkingCommand(pi, (extensionPi) => {
      extensionPi.registerCommand("thinking", {
        description: "legacy",
        handler: async () => {},
      });
      extensionPi.registerCommand("branch", {
        description: "git branch widget",
        handler: async () => {},
      });
    });

    expect(commands).toEqual(["branch"]);
  });

  it("restores command registration when bundled registration throws", async () => {
    const commands: string[] = [];
    const pi = registerCommandPi(commands);

    await expect(
      registerBundledExtensionWithoutThinkingCommand(pi, async (extensionPi) => {
        extensionPi.registerCommand("thinking", {
          description: "legacy",
          handler: async () => {},
        });
        throw new Error("kanagawa failed");
      }),
    ).rejects.toThrow("kanagawa failed");

    pi.registerCommand("thinking", {
      description: "restored",
      handler: async () => {},
    });
    expect(commands).toEqual(["thinking"]);
  });
});
