import { afterEach } from "vite-plus/test";
import type { HotmilkRuntime } from "../../src/config/runtime.ts";
import {
  BUNDLED_EXTENSION_IDS,
  type BundledExtensionId,
} from "../../src/config/bundled-extensions.ts";

/** Every bundled extension id disabled. */
export function allExtensionsDisabled(): Record<BundledExtensionId, boolean> {
  // SAFETY: every registry id is assigned exactly once by this map.
  return Object.fromEntries(BUNDLED_EXTENSION_IDS.map((id) => [id, false])) as Record<
    BundledExtensionId,
    boolean
  >;
}

/** Minimal {@link HotmilkRuntime} for startup and session tests. */
export function testRuntime(overrides: Partial<HotmilkRuntime> = {}): HotmilkRuntime {
  return {
    configPath: "/tmp/hotmilk.json",
    harness: "pi",
    harnessVersion: "0.0.0",
    extensionToggles: allExtensionsDisabled(),
    harnessSkips: [],
    lostDefaultOnIds: [],
    extensionFailures: [],
    globalExtensionSkips: [],
    defaults: {},
    graph: { warnOnStale: false, autoSuggestUpdate: false },
    projectTrust: { mode: "delegate", remember: false },
    ...overrides,
  };
}

const pendingEnvRestores: (() => void)[] = [];

// A test that throws before its own restore() call must not leak env into the next test.
afterEach(() => {
  while (pendingEnvRestores.length > 0) pendingEnvRestores.pop()!();
});

/** Set a process env var; restored by the returned function or, at the latest, after the test. */
export function setEnv(name: string, value: string): () => void {
  const previous = process.env[name];
  process.env[name] = value;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  };
  pendingEnvRestores.push(restore);
  return restore;
}

/**
 * Run a callback with `HOTMILK_CONFIG_ROOT` / `PI_CODING_AGENT_DIR` overrides,
 * restoring both afterwards (undefined clears the variable).
 */
export async function withConfigEnv<T>(
  hotmilkRoot: string | undefined,
  piRoot: string | undefined,
  run: () => T,
): Promise<Awaited<T>> {
  const previousHotmilk = process.env.HOTMILK_CONFIG_ROOT;
  const previousPi = process.env.PI_CODING_AGENT_DIR;
  if (hotmilkRoot === undefined) delete process.env.HOTMILK_CONFIG_ROOT;
  else process.env.HOTMILK_CONFIG_ROOT = hotmilkRoot;
  if (piRoot === undefined) delete process.env.PI_CODING_AGENT_DIR;
  else process.env.PI_CODING_AGENT_DIR = piRoot;
  try {
    return await run();
  } finally {
    if (previousHotmilk === undefined) delete process.env.HOTMILK_CONFIG_ROOT;
    else process.env.HOTMILK_CONFIG_ROOT = previousHotmilk;
    if (previousPi === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousPi;
  }
}
