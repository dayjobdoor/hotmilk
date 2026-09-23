import type { HotmilkRuntime } from "../../src/config/runtime.ts";
import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "../../src/config/bundled-extensions.ts";

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
    extensionToggles: allExtensionsDisabled(),
    globalExtensionSkips: [],
    defaults: { persona: "neutral" },
    graph: { warnOnStale: false, autoSuggestUpdate: false },
    projectTrust: { mode: "delegate", remember: false },
    ...overrides,
  };
}

/** Set a process env var and return a restore function. */
export function setEnv(name: string, value: string): () => void {
  const previous = process.env[name];
  process.env[name] = value;
  return () => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  };
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
