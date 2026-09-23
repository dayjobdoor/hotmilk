import { describe, expect, it } from "vite-plus/test";
import {
  initTheme,
  type ReadonlyFooterDataProvider,
  type Theme,
} from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import {
  formatFooterTime,
  footerModelRuntimeFromContext,
  setupHotmilkFooter,
} from "../src/ui/footer.ts";

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
  it("formats as a locale-independent HH:mm:ss string", () => {
    const formatted = formatFooterTime(new Date(2026, 4, 29, 14, 5, 9));
    expect(formatted).toBe("14:05:09");
  });
});

describe("setupHotmilkFooter", () => {
  it("does not install a footer when UI is unavailable", () => {
    let setFooterCalls = 0;
    const ctx = {
      hasUI: false,
      ui: { setFooter: () => setFooterCalls++ },
    };

    // SAFETY: test context only exercises the hasUI guard before UI access.
    setupHotmilkFooter(ctx as never, "ghostty");

    expect(setFooterCalls).toBe(0);
  });

  it("renders extension statuses and unsubscribes on dispose", () => {
    type FooterFactory = (
      tui: TUI,
      theme: Theme,
      footerData: ReadonlyFooterDataProvider,
    ) => {
      render(width: number): string[];
      dispose?(): void;
    };
    let footerFactory: FooterFactory | undefined;
    let unsubscribeCalls = 0;
    const ctx = {
      hasUI: true,
      model: undefined,
      thinkingLevel: "off",
      sessionManager: {
        getEntries: () => [],
        getCwd: () => "/tmp/hotmilk",
        getSessionName: () => undefined,
      },
      getContextUsage: () => ({ contextWindow: 1000, percent: 0 }),
      ui: {
        setFooter: (factory: typeof footerFactory) => {
          footerFactory = factory;
        },
      },
    };
    const footerData: ReadonlyFooterDataProvider = {
      getGitBranch: () => "main",
      getExtensionStatuses: () =>
        new Map([
          ["z-status", " zeta\nstatus "],
          ["a-status", " alpha\tstatus "],
        ]),
      getAvailableProviderCount: () => 1,
      onBranchChange: () => () => {
        unsubscribeCalls++;
      },
    };

    // SAFETY: test context supplies every field read by setupHotmilkFooter.
    initTheme(undefined, false);
    // SAFETY: test context covers only footer setup contract.
    setupHotmilkFooter(ctx as never, "ghostty");
    expect(footerFactory).toEqual(expect.any(Function));

    // SAFETY: footer render only uses TUI methods through component contract.
    const tui = {} as TUI;
    // SAFETY: footer render only uses fg and bold through theme contract.
    const theme = {
      fg: (_color: string, text: string) => text,
      bold: (text: string) => text,
    } as Theme;
    const component = footerFactory!(tui, theme, footerData);

    const lines = component.render(200);

    expect(lines.join("\n")).toContain("alpha status");
    expect(lines.join("\n")).toContain("zeta status");
    expect(lines.join("\n").indexOf("alpha status")).toBeLessThan(
      lines.join("\n").indexOf("zeta status"),
    );

    component.dispose?.();
    expect(unsubscribeCalls).toBe(1);
  });
});

describe("footerModelRuntimeFromContext", () => {
  it("resolves OAuth status from the current model or the registry fallback", () => {
    const anthropicModel: FooterModelStub = { provider: "anthropic", id: "claude" };
    const openaiModel: FooterModelStub = { provider: "openai", id: "gpt" };

    // Current model wins when it matches the provider.
    const runtime = footerModelRuntimeFromContext({
      model:
        // SAFETY: test double implements only the footer runtime methods.
        anthropicModel as never,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        {
          isUsingOAuth: (candidate: FooterModelCandidate) => candidate.provider === "anthropic",
          getAll: () => [openaiModel],
        } as never,
    });
    expect(runtime.isUsingOAuth("anthropic")).toBe(true);
    expect(runtime.isUsingOAuth("openai")).toBe(false);

    // A differing current model falls back to the registry list.
    const fallbackRuntime = footerModelRuntimeFromContext({
      model:
        // SAFETY: test double implements only the footer runtime methods.
        anthropicModel as never,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        {
          isUsingOAuth: (candidate: FooterModelCandidate) => candidate.provider === "openai",
          getAll: () => [openaiModel],
        } as never,
    });
    expect(fallbackRuntime.isUsingOAuth("openai")).toBe(true);

    // No matching model at all reports false.
    const emptyRuntime = footerModelRuntimeFromContext({
      model: undefined,
      modelRegistry:
        // SAFETY: test double implements only the footer runtime methods.
        {
          isUsingOAuth: () => true,
          getAll: () => [],
        } as never,
    });
    expect(emptyRuntime.isUsingOAuth("anthropic")).toBe(false);
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
});
