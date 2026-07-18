import { describe, expect, it } from "vite-plus/test";
import { formatFooterTime, footerModelRuntimeFromContext } from "../src/ui/footer.ts";

describe("formatFooterTime", () => {
  it("formats as HH:mm:ss in 24-hour style", () => {
    const formatted = formatFooterTime(new Date(2026, 4, 29, 14, 5, 9));
    expect(formatted).toMatch(/14:05:09/);
  });
});

describe("footerModelRuntimeFromContext", () => {
  it("delegates isUsingOAuth through the current model provider", () => {
    const model = { provider: "anthropic", id: "claude" } as const;
    const modelRegistry = {
      isUsingOAuth: (candidate: { provider: string }) => candidate.provider === "anthropic",
      getAll: () => [],
    };

    const runtime = footerModelRuntimeFromContext({
      model: model as never,
      modelRegistry: modelRegistry as never,
    });

    expect(runtime.isUsingOAuth("anthropic")).toBe(true);
    expect(runtime.isUsingOAuth("openai")).toBe(false);
  });

  it("falls back to registry lookup when current model provider differs", () => {
    const match = { provider: "openai", id: "gpt" } as const;
    const modelRegistry = {
      isUsingOAuth: (candidate: { provider: string }) => candidate.provider === "openai",
      getAll: () => [match],
    };

    const runtime = footerModelRuntimeFromContext({
      model: { provider: "anthropic", id: "claude" } as never,
      modelRegistry: modelRegistry as never,
    });

    expect(runtime.isUsingOAuth("openai")).toBe(true);
  });

  it("returns false when no matching model exists", () => {
    const runtime = footerModelRuntimeFromContext({
      model: undefined,
      modelRegistry: {
        isUsingOAuth: () => true,
        getAll: () => [],
      } as never,
    });

    expect(runtime.isUsingOAuth("anthropic")).toBe(false);
  });
});
