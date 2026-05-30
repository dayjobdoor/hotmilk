import { describe, expect, it } from "vite-plus/test";
import {
  formatFooterPwdWithGithubUser,
  isGithubRepoOwner,
  parseGithubUserFromRemote,
  resolveGithubFooterContextAsync,
  resolveGithubUsername,
  resolveRepoOwner,
} from "../src/ui/github-user.ts";

describe("parseGithubUserFromRemote", () => {
  it("parses https remotes", () => {
    expect(parseGithubUserFromRemote("https://github.com/hotmilk/pizza.git")).toBe("hotmilk");
  });

  it("parses ssh remotes", () => {
    expect(parseGithubUserFromRemote("git@github.com:hotmilk/pizza.git")).toBe("hotmilk");
  });

  it("returns undefined for non-github remotes", () => {
    expect(parseGithubUserFromRemote("git@gitlab.com:org/repo.git")).toBeUndefined();
  });
});

describe("formatFooterPwdWithGithubUser", () => {
  it("appends github handle after pwd", () => {
    expect(formatFooterPwdWithGithubUser("~/pizza/hotmilk (main)", "hotmilk")).toBe(
      "~/pizza/hotmilk (main) · @hotmilk",
    );
  });

  it("marks repo owner in plain-text helper", () => {
    expect(isGithubRepoOwner("hotmilk", "hotmilk")).toBe(true);
    expect(isGithubRepoOwner("Hotmilk", "hotmilk")).toBe(true);
    expect(isGithubRepoOwner("other", "hotmilk")).toBe(false);
  });

  it("leaves pwd unchanged when handle is missing", () => {
    expect(formatFooterPwdWithGithubUser("~/pizza/hotmilk", undefined)).toBe("~/pizza/hotmilk");
  });
});

describe("resolveRepoOwner", () => {
  it("reads owner from origin remote", () => {
    expect(
      resolveRepoOwner({
        runCommand: (file, args) => {
          if (file === "git" && args[0] === "remote") {
            return "git@github.com:dayjobdoor/hotmilk.git";
          }
          return undefined;
        },
      }),
    ).toBe("dayjobdoor");
  });
});

describe("resolveGithubUsername", () => {
  it("prefers GITHUB_USER env", () => {
    expect(
      resolveGithubUsername({
        env: { GITHUB_USER: "env-user" },
        runCommand: () => "gh-user",
      }),
    ).toBe("env-user");
  });

  it("falls back to gh api login", () => {
    expect(
      resolveGithubUsername({
        env: {},
        runCommand: (file, args) => {
          if (file === "gh" && args[0] === "api") {
            return "gh-user";
          }
          return undefined;
        },
      }),
    ).toBe("gh-user");
  });

  it("falls back to origin remote owner", () => {
    expect(
      resolveGithubUsername({
        env: {},
        runCommand: (file, args) => {
          if (file === "git" && args[0] === "remote") {
            return "https://github.com/remote-user/repo.git";
          }
          return undefined;
        },
      }),
    ).toBe("remote-user");
  });
});

describe("resolveGithubFooterContextAsync", () => {
  it("resolves user and owner from a single origin lookup", async () => {
    const calls: string[] = [];
    const result = await resolveGithubFooterContextAsync({
      env: {},
      runCommandAsync: async (file, args) => {
        calls.push(`${file} ${args.join(" ")}`);
        if (file === "git" && args[0] === "remote") {
          return "git@github.com:dayjobdoor/hotmilk.git";
        }
        return undefined;
      },
    });

    expect(result).toEqual({ githubUser: "dayjobdoor", repoOwner: "dayjobdoor" });
    expect(calls.filter((call) => call.startsWith("git remote"))).toHaveLength(1);
  });

  it("prefers env user while still resolving repo owner", async () => {
    const result = await resolveGithubFooterContextAsync({
      env: { GITHUB_USER: "env-user" },
      runCommandAsync: async (file, args) => {
        if (file === "git" && args[0] === "remote") {
          return "https://github.com/dayjobdoor/hotmilk.git";
        }
        return undefined;
      },
    });

    expect(result).toEqual({ githubUser: "env-user", repoOwner: "dayjobdoor" });
  });
});
