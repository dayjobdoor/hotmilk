import { describe, expect, it } from "vite-plus/test";
import { formatFooterTime, footerModelRuntimeFromContext } from "../src/ui/footer.ts";

type FooterModelCandidate = { provider: string };

type FooterModelStub = {
  provider: string;
  id: string;
};

type FooterProviderAuth = {
  auth: {
    oauth?: { isSubscription: boolean };
    apiKey?: Record<string, never>;
  };
};

type FooterProviderMap = {
  anthropic: FooterProviderAuth;
  openai: FooterProviderAuth;
  groq: FooterProviderAuth;
};

describe("formatFooterTime", () => {
  it("formats as HH:mm:ss in 24-hour style", () => {
    const formatted = formatFooterTime(new Date(2026, 4, 29, 14, 5, 9));
    expect(formatted).toMatch(/14:05:09/);
  });
});

describe("footerModelRuntimeFromContext", () => {
  it("returns OAuth status for the current provider", () => {
    const model: FooterModelStub = { provider: "anthropic", id: "claude" };
    const modelRegistry = {
      isUsingOAuth: (candidate: FooterModelCandidate) => candidate.provider === "anthropic",
      getAll: () => [],
    };
    const runtime = footerModelRuntimeFromContext({
      model:
        // SAFETY: test double implements only the footer runtime methods.
        model as never,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        modelRegistry as never,
    });

    expect(runtime.isUsingOAuth("anthropic")).toBe(true);
    expect(runtime.isUsingOAuth("openai")).toBe(false);
  });
  it("marks only OAuth providers with subscription auth as subscriptions", () => {
    const subscriptionModel: FooterModelStub = { provider: "anthropic", id: "claude" };
    const oauthModel: FooterModelStub = { provider: "openai", id: "codex" };
    const apiKeyModel: FooterModelStub = { provider: "groq", id: "llama" };
    const providers: FooterProviderMap = {
      anthropic: { auth: { oauth: { isSubscription: true } } },
      openai: { auth: { oauth: { isSubscription: false } } },
      groq: { auth: { apiKey: {} } },
    };
    const runtime = footerModelRuntimeFromContext({
      model:
        // SAFETY: test double implements only the footer runtime methods.
        subscriptionModel as never,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        {
          isUsingOAuth: (candidate: FooterModelCandidate) =>
            candidate.provider === "anthropic" || candidate.provider === "openai",
          getAll: () => [subscriptionModel, oauthModel, apiKeyModel],
          getProvider: (provider: string) =>
            provider === "anthropic" || provider === "openai" || provider === "groq"
              ? providers[provider]
              : undefined,
        } as never,
    });

    expect(runtime.isUsingSubscription("anthropic")).toBe(true);
    expect(runtime.isUsingSubscription("openai")).toBe(false);
    expect(runtime.isUsingSubscription("groq")).toBe(false);
  });

  it("returns OAuth status from a registry model when provider differs", () => {
    const match: FooterModelStub = { provider: "openai", id: "gpt" };
    const modelRegistry = {
      isUsingOAuth: (candidate: FooterModelCandidate) => candidate.provider === "openai",
      getAll: () => [match],
    };

    const runtime = footerModelRuntimeFromContext({
      model:
        // SAFETY: test double implements only the footer runtime methods.
        { provider: "anthropic", id: "claude" } as never,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        modelRegistry as never,
    });

    expect(runtime.isUsingOAuth("openai")).toBe(true);
  });
  it("returns false when no current or registry model matches", () => {
    const runtime = footerModelRuntimeFromContext({
      model: undefined,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        {
          isUsingOAuth: () => true,
          getAll: () => [],
        } as never,
    });

    expect(runtime.isUsingOAuth("anthropic")).toBe(false);
  });
});
