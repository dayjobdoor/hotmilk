import { describe, expect, it } from "vite-plus/test";
import { isJsonObject, isJsonString, parseJsonValue } from "../src/bootstrap/json.ts";
import registerKanagawa from "../src/bundled/kanagawa.ts";
import { recordingPi } from "./fixtures/recording-pi.ts";

type InputTransformResult =
  | { action: "continue" | "handled" }
  | { action: "transform"; text: string };

type InputEventHandler = (event: { text: string }) => Promise<InputTransformResult>;

type RegisteredInput = {
  handler: InputEventHandler;
  calls: { method: PropertyKey; args: unknown[] }[];
};

function registeredInputHandler(): RegisteredInput {
  const { pi, calls } = recordingPi();
  registerKanagawa(pi);
  // SAFETY: the extracted handler is kanagawa's own code; args[1] of the "on"
  // call is its handler function.
  const handler = calls.find(
    ({ method, args }) => method === "on" && args[0] === "input",
  )?.args[1] as InputEventHandler;
  return { handler, calls };
}

describe("bundled kanagawa extension", () => {
  it("registers event handlers and no duplicate /thinking command", () => {
    const { pi, accessed, calls } = recordingPi();
    registerKanagawa(pi);

    expect(accessed).toContain("on");
    const registeredCommands = calls
      .filter(({ method }) => method === "registerCommand")
      .map(({ args }) => {
        const spec = parseJsonValue(JSON.stringify(args[0] ?? null));
        return isJsonObject(spec) && isJsonString(spec.name) ? spec.name : "?";
      });
    expect(registeredCommands).toEqual([]);
    const events = calls
      .filter(({ method }) => method === "on")
      .map(({ args }) => args[0]);
    expect(events).toEqual(
      expect.arrayContaining(["input", "session_start", "agent_start", "agent_end"]),
    );
  });

  it("input interceptor maps @thinking tags to the Pi transform result", async () => {
    const { handler, calls } = registeredInputHandler();

    const transform = await handler({ text: "x @thinking:high" });
    expect(transform).toEqual({ action: "transform", text: "x" });
    expect(calls).toContainEqual({ method: "setThinkingLevel", args: ["high"] });

    const noTag = await handler({ text: "plain message" });
    expect(noTag).toEqual({ action: "continue" });
  });
});