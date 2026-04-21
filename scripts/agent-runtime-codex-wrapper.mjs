#!/usr/bin/env node
import { runCodexExec } from "../src/agent-runtime/codex-cli-wrapper.js";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const raw = await readStdin();
const envelope = raw.trim() ? JSON.parse(raw) : {};
const result = await runCodexExec(envelope, {
  cwd: process.cwd()
});
process.stdout.write(`${JSON.stringify(result)}\n`);
