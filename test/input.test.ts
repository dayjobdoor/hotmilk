import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vite-plus/test";
import { registerInputCommands } from "../src/controller/input.ts";

type CommandHandler = (args: string, ctx: ExtensionContext) => Promise<void>;

function captureInputCommandHandlers() {
  const handlers = new Map<string, CommandHandler>();
  const sendUserMessage = vi.fn();
  const pi = {
    registerCommand(name: string, spec: { handler: CommandHandler }) {
      handlers.set(name, spec.handler);
    },
    sendUserMessage,
  };

  // SAFETY: test double implements only registerCommand and sendUserMessage.
  registerInputCommands(pi as never);
  return { handlers, sendUserMessage };
}

function inputContext(overrides: { isIdle?: boolean } = {}) {
  return {
    isIdle: () => overrides.isIdle ?? true,
    abort: vi.fn(),
    ui: { notify: vi.fn() },
  };
}

describe("registerInputCommands", () => {
  it("stop aborts active work and reports the idle state", async () => {
    const { handlers } = captureInputCommandHandlers();

    const busy = inputContext({ isIdle: false });
    // SAFETY: command handlers only read isIdle, abort, and ui.notify.
    await handlers.get("stop")!("", busy as never);
    expect(busy.abort).toHaveBeenCalledOnce();
    expect(busy.ui.notify).toHaveBeenCalledWith("Stopped current work.", "warning");

    const idle = inputContext();
    // SAFETY: command handlers only read isIdle, abort, and ui.notify.
    await handlers.get("stop")!("", idle as never);
    expect(idle.abort).not.toHaveBeenCalled();
    expect(idle.ui.notify).toHaveBeenCalledWith("No running work to stop.", "info");
  });

  it("interrupt rejects empty prompts and steers non-empty ones", async () => {
    const { handlers, sendUserMessage } = captureInputCommandHandlers();

    const empty = inputContext();
    // SAFETY: command handlers only read isIdle, abort, and ui.notify.
    await handlers.get("interrupt")!("", empty as never);
    expect(empty.ui.notify).toHaveBeenCalledWith("Usage: /interrupt <prompt>", "warning");
    expect(sendUserMessage).not.toHaveBeenCalled();

    const prompted = inputContext();
    // SAFETY: command handlers only read isIdle, abort, and ui.notify.
    await handlers.get("interrupt")!("fix the bug", prompted as never);
    expect(sendUserMessage).toHaveBeenCalledWith("[INTERRUPT] fix the bug", {
      deliverAs: "steer",
    });
    expect(prompted.ui.notify).toHaveBeenCalledWith("Interrupt prompt sent.", "info");
  });
});
