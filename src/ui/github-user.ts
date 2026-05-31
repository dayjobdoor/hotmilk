import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const COMMAND_TIMEOUT_MS = 2_000;
const execFileAsync = promisify(execFile);

function normalizeCommandOutput(output: string): string | undefined {
  const trimmed = output.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function githubUserFromEnv(env: NodeJS.ProcessEnv): string | undefined {
  return env.GITHUB_USER?.trim() || env.GH_USER?.trim() || undefined;
}

function githubUsernameCommands(
  cwd: string,
): Array<{ file: string; args: string[]; cwd?: string }> {
  return [
    { file: "gh", args: ["api", "user", "-q", ".login"] },
    { file: "git", args: ["config", "--global", "github.user"] },
    { file: "git", args: ["config", "github.user"], cwd },
  ];
}

function runCommand(file: string, args: string[], cwd?: string): string | undefined {
  try {
    const output = execFileSync(file, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: COMMAND_TIMEOUT_MS,
    });
    return normalizeCommandOutput(output);
  } catch {
    return undefined;
  }
}

async function runCommandAsync(
  file: string,
  args: string[],
  cwd?: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(file, args, {
      cwd,
      encoding: "utf8",
      timeout: COMMAND_TIMEOUT_MS,
    });
    return normalizeCommandOutput(stdout);
  } catch {
    return undefined;
  }
}

const GITHUB_REMOTE_OWNER =
  /^(?:git@github\.com:|https?:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([^/]+)\//;

/** Parse `owner` from common github.com remote URL shapes. */
export function parseGithubUserFromRemote(url: string): string | undefined {
  return GITHUB_REMOTE_OWNER.exec(url.trim())?.[1];
}

export function formatFooterPwdWithGithubUser(pwd: string, githubUser: string | undefined): string {
  if (!githubUser) {
    return pwd;
  }
  return `${pwd} · @${githubUser}`;
}

export function isGithubRepoOwner(githubUser: string, repoOwner: string | undefined): boolean {
  return repoOwner !== undefined && githubUser.toLowerCase() === repoOwner.toLowerCase();
}

export type ResolveRepoOwnerOptions = {
  cwd?: string;
  runCommand?: (file: string, args: string[], cwd?: string) => string | undefined;
};

/** GitHub owner from `origin` remote, when the cwd is a git checkout. */
export function resolveRepoOwner(opts: ResolveRepoOwnerOptions = {}): string | undefined {
  const cwd = opts.cwd ?? process.cwd();
  const exec = opts.runCommand ?? runCommand;
  const remote = exec("git", ["remote", "get-url", "origin"], cwd);
  if (!remote) {
    return undefined;
  }
  return parseGithubUserFromRemote(remote);
}

export type ResolveGithubUsernameOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  runCommand?: (file: string, args: string[], cwd?: string) => string | undefined;
};

/** Best-effort GitHub login for footer display (env → gh → git config → origin remote). */
export function resolveGithubUsername(opts: ResolveGithubUsernameOptions = {}): string | undefined {
  const cwd = opts.cwd ?? process.cwd();
  const env = opts.env ?? process.env;
  const exec = opts.runCommand ?? runCommand;

  const fromEnv = githubUserFromEnv(env);
  if (fromEnv) {
    return fromEnv;
  }

  for (const { file, args, cwd: commandCwd } of githubUsernameCommands(cwd)) {
    const value = exec(file, args, commandCwd);
    if (value) {
      return value;
    }
  }

  const remote = exec("git", ["remote", "get-url", "origin"], cwd);
  return remote ? parseGithubUserFromRemote(remote) : undefined;
}

export type GithubFooterContext = {
  githubUser?: string;
  repoOwner?: string;
};

export type ResolveGithubFooterContextOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  runCommandAsync?: (file: string, args: string[], cwd?: string) => Promise<string | undefined>;
};

/** Resolve footer GitHub handle + repo owner without blocking UI startup. */
export async function resolveGithubFooterContextAsync(
  opts: ResolveGithubFooterContextOptions = {},
): Promise<GithubFooterContext> {
  const cwd = opts.cwd ?? process.cwd();
  const env = opts.env ?? process.env;
  const exec = opts.runCommandAsync ?? runCommandAsync;

  const remote = await exec("git", ["remote", "get-url", "origin"], cwd);
  const repoOwner = remote ? parseGithubUserFromRemote(remote) : undefined;

  const fromEnv = githubUserFromEnv(env);
  if (fromEnv) {
    return { githubUser: fromEnv, repoOwner };
  }

  for (const { file, args, cwd: commandCwd } of githubUsernameCommands(cwd)) {
    const value = await exec(file, args, commandCwd);
    if (value) {
      return { githubUser: value, repoOwner };
    }
  }

  return { githubUser: repoOwner, repoOwner };
}
