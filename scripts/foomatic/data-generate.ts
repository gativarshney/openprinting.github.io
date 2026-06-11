import { spawnSync } from "child_process";

const forwardedArgs = process.argv.slice(2);
const skipPpd = forwardedArgs.includes("--skip-ppd") || process.platform === "win32";
const skipSimilarity =
  forwardedArgs.includes("--skip-similarity") ||
  process.env.FOOMATIC_SKIP_SIMILARITY === "1";
const steps: Array<[string, string[]]> = [
  ["scripts/foomatic/generate-from-xml.ts", []],
  ...(skipPpd ? [] : ([["scripts/foomatic/generate-ppds.sh", []]] as Array<[string, string[]]>)),
  ["scripts/foomatic/combine-data.ts", forwardedArgs],
  ["scripts/foomatic/split-printers.ts", []],
  ...(skipSimilarity
    ? []
    : ([
        ["scripts/foomatic/vectorize.ts", []],
        ["scripts/foomatic/compute-similarity.ts", []],
      ] as Array<[string, string[]]>)),
];

for (const [scriptPath, args] of steps) {
  const command = scriptPath.endsWith(".sh") ? "/bin/bash" : "tsx";
  const commandArgs = scriptPath.endsWith(".sh")
    ? [scriptPath, ...args]
    : [scriptPath, ...args];
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
