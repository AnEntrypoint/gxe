#!/usr/bin/env node

const { runScript } = require("./runner");

const args = process.argv.slice(2);

if (!args.length) {
  console.error("Usage: gxe <repo> [script] [args...]");
  console.error("Examples:");
  console.error("  gxe user/repo");
  console.error("  gxe user/repo start");
  console.error("  gxe user/repo build --prod");
  process.exit(1);
}

const repo = args[0];
const script = args[1] || "start";
const scriptArgs = args.slice(2);

runScript(repo, script, scriptArgs)
  .then((code) => {
    process.exit(code || 0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
