export class McpLlmSqlDbAdapter {
  constructor(options = {}) {
    this.options = options;
    this.client = options.client;
    this.kind = "mcp";
  }

  async recordRun(summary) {
    if (!this.options.enabled) {
      return {
        runId: `disabled-${Date.now()}`,
        mode: summary.mode,
        stored: false
      };
    }

    return this.client.request({
      server: this.options.server,
      action: "recordHarnessRun",
      payload: {
        mode: summary.mode,
        dryRun: summary.dryRun,
        ticketCount: summary.ticketCount
      }
    });
  }

  async runDiagnosticQuery(request) {
    if (!this.options.enabled) {
      return {
        used: false,
        source: "mcp",
        rows: [],
        summary: ""
      };
    }

    return this.client.request({
      server: this.options.server,
      action: "runDiagnosticQuery",
      payload: {
        namespace: this.options.namespace ?? "bpopilot-ticket-harness",
        phase: request.phase,
        ticketKey: request.ticketKey,
        query: request.query ?? request.statement,
        parameters: request.parameters ?? {}
      }
    });
  }
}
