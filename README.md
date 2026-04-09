# Malkuth

`Malkuth` is a local-first harness for triage, verification, and controlled execution of technical work items.

It is designed for environments where an agentic workflow should not jump directly from “ticket received” to “code changed” without policy checks, scoped execution rules, and optional human confirmation.

## What It Does

The runtime is built to:

1. read work items from a configured source
2. map the request to a product and repository target
3. reuse optional operational memory and semantic retrieval
4. verify payloads, changed paths, command preflight, and public hygiene
5. pause for human clarification when confidence is not high enough
6. execute branch, commit, and pull request steps only when policy allows it

## Why It Exists

Many “ticket-to-code” automation flows are unsafe because they collapse triage, policy, and execution into one step.

`Malkuth` separates those concerns into explicit stages:

- triage
- verification
- execution
- reporting

The goal is not autonomous merge automation. The goal is a controlled local harness for serious engineering workflows.

## Architecture

```text
Ticket source
  -> Jira adapter (mock | mcp)
  -> TriageAgent
       -> llm-context adapter
       -> ticket memory
       -> llm-memory adapter
       -> optional SQL diagnostics
  -> VerificationAgent
       -> payload checks
       -> path policy
       -> command preflight
       -> public hygiene scan
       -> optional human clarification loop
  -> ExecutionAgent
       -> bitbucket adapter (mock | mcp)
       -> optional SQL diagnostics
  -> Reports
       -> triage report
       -> execution report
       -> final report
       -> audit trail
```

Main areas:

- `src/orchestration/`: top-level run orchestration
- `src/adapters/`: runtime adapters and external integration boundaries
- `src/agents/`: triage, verification, and execution stages
- `src/mcp/`: MCP bridge and registry/client glue
- `src/security/`: public hygiene scanning and redaction
- `src/logging/`: structured run logging
- `src/reporting/`: final report generation
- `config/`: publishable example configurations plus local setup guidance

## Safety Model

Guard rails in the runtime include:

- `allowMerge` blocked by default
- `allowRealPrs` requiring explicit enablement
- trust-level separation between `mock`, `mcp-readonly`, and `mcp-write`
- allowlists for repositories, base branches, commands, and MCP actions
- public-hygiene scanning for sensitive strings and placeholder safety
- redaction across reports, logs, and semantic memory
- deferred human-in-the-loop interaction when confidence is insufficient

## Local Run

Requirements:

- Node.js 22+
- local configuration derived from the example files in `config/`

Install:

```bash
npm install
```

Common flows:

```bash
node src/cli.js triage --config ./config/harness.config.example.json --dry-run
node src/cli.js run --config ./config/harness.config.example.json --dry-run
node src/cli.js audit --config ./config/harness.config.example.json
node src/cli.js review --config ./config/harness.config.example.json
node src/cli.js questions --config ./config/harness.config.example.json
node src/cli.js monitor --config ./config/harness.config.example.json --limit 20
```

## Configuration

Publishable example configs:

- `config/harness.config.example.json`
- `config/harness.config.mcp.example.json`
- `config/harness.config.real.example.json`
- `config/harness.config.triage.codex-local.example.json`

Real values should stay in local untracked files such as:

- `config/local/harness.local.json`
- `config/local/harness.mcp.local.json`
- `config/local/harness.real.local.json`
- `config/codex.mcp.local.toml`

The repository is explicitly meant to stay free of:

- local paths
- real tenant identifiers
- real repository and branch names
- secret material
- real MCP bridge command lines

## Project Status

This repository is in active development. The current runtime already demonstrates the intended architecture and safety model, but the project is still evolving and should be treated as an active engineering harness rather than a finished product.

## Development Process

Built with AI-assisted workflows, while architecture, tradeoffs, integration, review, and validation were directed by the author.
