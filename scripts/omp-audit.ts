/**
 * Verify the registry `omp` flags against the omp binary on PATH.
 *
 * Loads hotmilk under `omp --mode rpc` once per bundled row (only that toggle
 * on, gating off, isolated agent dir) and diffs the slash commands and tools
 * the row adds over an all-off baseline. A row is verified when it loads
 * without error AND adds at least one command or tool; a row that loads but
 * adds nothing has no observable evidence and stays unverified.
 *
 * Exits 1 when omp's version differs from `OMP_AUDITED_VERSION` or when a row's
 * `omp` flag disagrees with the verdict. CI runs this against the pinned omp
 * release. Run: `bun run audit:omp [ids...]`.
 *
 * Lives outside `tools/`: omp scans a loaded package's `tools/` dir for custom
 * tools, and a script there hangs omp startup in `loadCustomTools`.
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUNDLED_EXTENSION_DEFINITIONS,
  OMP_AUDITED_VERSION,
} from "../src/config/bundled-extensions.ts";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const TIMEOUT_MS = 90_000;
const BATCH = 8;
const TIMEOUT_ERROR = "no RPC answer before timeout";
// Optional ids on argv audit only those rows: `bun run audit:omp -- todo btw`.
const ONLY = process.argv.slice(2);

// Probe extension: `/audit-tools` dumps every registered tool name (no model call).
const PROBE_DIR = mkdtempSync(join(tmpdir(), "omp-audit-probe-"));
const PROBE = join(PROBE_DIR, "probe.ts");
writeFileSync(
  PROBE,
  `import { writeFileSync } from "node:fs";
export default function probe(pi) {
  pi.registerCommand("audit-tools", {
    description: "hotmilk audit: dump tool names",
    handler: async () => {
      writeFileSync(process.env.OMP_AUDIT_TOOLS, JSON.stringify(pi.getAllTools().map((t) => t.name)));
    },
  });
}
`,
);

type Surface = { error?: string; commands: string[]; tools: string[] };
/** omp RPC frames this script reads (omp://rpc.md): command list, prompt result, extension errors. */
type RpcFrame = {
  id?: string;
  type?: string;
  error?: string;
  data?: { commands?: { name: string }[] };
};

function parseFrames(stdout: string): RpcFrame[] {
  return stdout.split("\n").flatMap((line) => {
    try {
      // SAFETY: omp RPC emits one JSON object per line in the RpcFrame shape; fields are optional.
      return [JSON.parse(line) as RpcFrame];
    } catch {
      return [];
    }
  });
}

function readTools(path: string): string[] {
  try {
    // SAFETY: the probe writes a JSON array of tool-name strings.
    return JSON.parse(readFileSync(path, "utf8")) as string[];
  } catch {
    return [];
  }
}

// Allowlist, not denylist: omp loads every bundled third-party extension ungated, so
// publish tokens and API keys in the caller's environment (or a repo `.env`) must not reach it.
const INHERITED_ENV = ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "TERM", "USER", "SHELL"];

/** Environment for a hermetic omp: fresh agent dir, no user profile, no setup scenes, no secrets. */
function isolatedEnv(cfg: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of INHERITED_ENV) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return {
    ...env,
    PI_CODING_AGENT_DIR: join(cfg, "agent"),
    OMP_SKIP_SETUP: "1",
    HOTMILK_CONFIG_ROOT: cfg,
    HOTMILK_OMP_UNGATED: "1",
    OMP_AUDIT_TOOLS: join(cfg, "tools.json"),
  };
}

// Live omp process groups; killed on exit so Ctrl-C mid-batch leaves no strays.
const live = new Set<number>();
function killGroup(pid: number): void {
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    // group already gone
  }
}
function killAll(): void {
  for (const pid of live) killGroup(pid);
}
process.on("exit", killAll);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    killAll();
    process.exit(130);
  });
}

function run(extensions: Record<string, boolean>): Promise<Surface> {
  const cfg = mkdtempSync(join(tmpdir(), "omp-audit-"));
  writeFileSync(join(cfg, "hotmilk.json"), JSON.stringify({ extensions }));
  const env = isolatedEnv(cfg);
  const proc = spawn(
    "omp",
    ["--mode", "rpc", "--no-ui", "--no-session", "-e", REPO, "-e", PROBE],
    { cwd: REPO, env, detached: true }, // own process group: row children die with omp
  );
  const pid = proc.pid;
  if (pid !== undefined) live.add(pid);
  proc.stdin.on("error", () => {}); // omp may exit before it answers; a closed pipe is a verdict, not a crash
  let stdout = "";
  let stderr = "";
  proc.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString())); // drain: a full pipe blocks omp
  // omp drops requests sent before startup finishes; resend until it answers.
  const poll = setInterval(
    () => proc.stdin.write('{"id":"c","type":"get_available_commands"}\n'),
    2_000,
  );
  let asked = false;
  return new Promise((done) => {
    const finish = () => {
      clearInterval(poll);
      clearTimeout(deadline);
      if (pid !== undefined) killGroup(pid); // omp ignores SIGTERM in rpc mode; strays pile up otherwise
    };
    const deadline = setTimeout(finish, TIMEOUT_MS);
    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (!asked && stdout.includes('"id":"c"')) {
        asked = true;
        clearInterval(poll);
        proc.stdin.write('{"id":"t","type":"prompt","message":"/audit-tools"}\n');
      }
      if (stdout.includes('"type":"prompt_result","id":"t"')) finish();
    });
    proc.on("close", () => {
      clearInterval(poll);
      clearTimeout(deadline);
      if (pid !== undefined) live.delete(pid);
      const frames = parseFrames(stdout);
      const extError = frames.find((f) => f.type === "extension_error")?.error;
      const loadError = stderr.match(/Failed to load extension[^\n]*?: ([^\n]{0,200})/)?.[1];
      const answered = frames.find((f) => f.id === "c" && f.type === "response");
      const surface: Surface = {
        error: loadError ?? extError ?? (answered ? undefined : TIMEOUT_ERROR),
        commands: (answered?.data?.commands ?? []).map((command) => command.name),
        tools: readTools(env.OMP_AUDIT_TOOLS ?? ""),
      };
      rmSync(cfg, { recursive: true, force: true });
      done(surface);
    });
  });
}

const ompVersion = execFileSync("omp", ["--version"]).toString().trim();
if (ompVersion !== `omp/${OMP_AUDITED_VERSION}`) {
  console.error(`${ompVersion} on PATH; OMP_AUDITED_VERSION is ${OMP_AUDITED_VERSION}.`);
  console.error("Install the audited omp, or bump OMP_AUDITED_VERSION and re-audit every row.");
  process.exit(1);
}

/** One retry for a timeout only: a CPU-starved runner is not a verdict; a load error is. */
async function runStable(extensions: Record<string, boolean>): Promise<Surface> {
  const first = await run(extensions);
  return first.error === TIMEOUT_ERROR ? run(extensions) : first;
}

const unknownIds = ONLY.filter((id) => !BUNDLED_EXTENSION_DEFINITIONS.some((d) => d.id === id));
if (unknownIds.length > 0) {
  console.error(`Unknown row id(s): ${unknownIds.join(", ")}`);
  process.exit(1);
}

const baseline = await runStable({});
if (baseline.error) throw new Error(`baseline failed: ${baseline.error}`);
const ownCommands = ["mode", "stop", "interrupt"].filter((name) => !baseline.commands.includes(name));
if (ownCommands.length > 0) {
  throw new Error(`baseline is missing hotmilk command(s): ${ownCommands.join(", ")}`);
}
const added = (now: string[], base: string[]) => now.filter((x) => !base.includes(x));

const rows: { id: string; flag: boolean; surface: Surface }[] = [];
const targets = BUNDLED_EXTENSION_DEFINITIONS.filter(
  (d) => ONLY.length === 0 || ONLY.includes(d.id),
);
for (let i = 0; i < targets.length; i += BATCH) {
  const batch = targets.slice(i, i + BATCH);
  const results = await Promise.all(batch.map((d) => runStable({ [d.id]: true })));
  batch.forEach((d, j) =>
    rows.push({ id: d.id, flag: "omp" in d && d.omp === true, surface: results[j]! }),
  );
}

let mismatches = 0;
for (const { id, flag, surface } of rows) {
  const commands = added(surface.commands, baseline.commands);
  const tools = added(surface.tools, baseline.tools);
  const verified = !surface.error && commands.length + tools.length > 0;
  const verdict = surface.error ? "fails" : verified ? "verified" : "no-surface";
  if (verified !== flag) mismatches++;
  const detail = surface.error ?? `+cmd[${commands.join(",")}] +tool[${tools.join(",")}]`;
  console.log(
    `${verified === flag ? "ok      " : "MISMATCH"} ${id.padEnd(22)} flag=${String(flag).padEnd(5)} ${verdict.padEnd(10)} ${detail}`,
  );
}
console.log(`\n${mismatches} mismatch(es) against ${ompVersion}`);
rmSync(PROBE_DIR, { recursive: true, force: true });
process.exit(mismatches > 0 ? 1 : 0);
