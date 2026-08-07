import { describe, expect, it } from "vite-plus/test";
import { formatFooterTime, footerModelRuntimeFromContext } from "../src/ui/footer.ts";

describe("formatFooterTime", () => {
  it("formats as HH:mm:ss in 24-hour style", () => {
    const formatted = formatFooterTime(new Date(2026, 4, 29, 14, 5, 9));
    expect(formatted).toMatch(/14:05:09/);
  });
});

describe("footerModelRuntimeFromContext", () => {
  it("returns OAuth status for the current provider", () => {
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

  it("marks only OAuth providers with subscription auth as subscriptions", () => {
    const subscriptionModel = { provider: "anthropic", id: "claude" } as const;
    const oauthModel = { provider: "openai", id: "codex" } as const;
    const apiKeyModel = { provider: "groq", id: "llama" } as const;
    const providers = {
      anthropic: { auth: { oauth: { isSubscription: true } } },
      openai: { auth: { oauth: { isSubscription: false } } },
      groq: { auth: { apiKey: {} } },
    };
    const runtime = footerModelRuntimeFromContext({
      model: subscriptionModel as never,
      modelRegistry: {
        isUsingOAuth: (candidate: { provider: string }) =>
          candidate.provider === "anthropic" || candidate.provider === "openai",
        getAll: () => [subscriptionModel, oauthModel, apiKeyModel],
        getProvider: (provider: string) => providers[provider as keyof typeof providers],
      } as never,
    });

    expect(runtime.isUsingSubscription("anthropic")).toBe(true);
    expect(runtime.isUsingSubscription("openai")).toBe(false);
    expect(runtime.isUsingSubscription("groq")).toBe(false);
  });

  it("returns OAuth status from a registry model when provider differs", () => {
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

  it("returns false when no current or registry model matches", () => {
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
