#!/usr/bin/env node

const { runScript } = require("./runner");

const args = process.argv.slice(2);

if (!args.length) {
  console.error("Usage: gxe <repo> [script] [args...]");
  console.error("Examples:");
  console.error("  gxe user/repo");
  console.error("  gxe user/repo start");
  console.error("  gxe user/repo webhook:task --taskName=myTask --input='{...}'");
  console.error("  gxe user/repo build --prod");
  console.error("\nOptions:");
  console.error("  --env.VAR=value       Pass environment variables to the script");
  console.error("  --capture-output      Capture and output as JSON result");
  process.exit(1);
}

const repo = args[0];
const script = args[1] || "start";

// Parse args and extract environment variables
const scriptArgs = [];
const env = {};
let captureOutput = false;

for (let i = 2; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith("--env.")) {
    const [key, value] = arg.slice(6).split("=");
    env[key] = value;
  } else if (arg === "--capture-output") {
    captureOutput = true;
  } else {
    scriptArgs.push(arg);
  }
}

const options = { env: Object.keys(env).length > 0 ? env : undefined };
if (captureOutput) {
  options.captureOutput = true;
}

runScript(repo, script, scriptArgs, options)
  .then((result) => {
    if (typeof result === "object" && result.code !== undefined) {
      // Captured output mode
      if (captureOutput && result.stdout) {
        console.log(result.stdout);
      }
      process.exit(result.code || 0);
    } else {
      // Normal mode (stdio inherited)
      process.exit(result || 0);
    }
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
