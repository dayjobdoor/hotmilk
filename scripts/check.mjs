// Every skill dir needs SKILL.md with frontmatter name == dir name and a description.
import { readdirSync, readFileSync } from "node:fs";

let bad = 0;
for (const dir of readdirSync("skills", { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const fm = readFileSync(`skills/${dir.name}/SKILL.md`, "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const name = fm.match(/^name:\s*(.+)$/m)?.[1].trim();
  if (name !== dir.name || !/^description:\s*\S/m.test(fm)) {
    console.error(`skills/${dir.name}/SKILL.md: bad frontmatter (name=${name})`);
    bad++;
  }
}
process.exit(bad ? 1 : 0);
