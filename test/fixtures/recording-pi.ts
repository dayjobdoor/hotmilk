import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export type RecordingPi = {
  pi: ExtensionAPI;
  accessed: PropertyKey[];
};

/**
 * Minimal ExtensionAPI stand-in that records which members an extension touches.
 * Methods are chainable no-ops, so a disabled bundle must leave `accessed` empty.
 */
export function recordingPi(): RecordingPi {
  const accessed: PropertyKey[] = [];
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      accessed.push(prop);
      return () => pi;
    },
  };
  // SAFETY: test double; only get trap is used, methods are no-ops.
  const pi = new Proxy({}, handler) as ExtensionAPI;
  return { pi, accessed };
}
