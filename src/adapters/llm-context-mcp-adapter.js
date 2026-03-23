export class McpLlmContextAdapter {
  constructor(options = {}) {
    this.options = options;
    this.client = options.client;
    this.kind = "mcp";
  }

  async mapTicketToCodebase(ticket) {
    const response = await this.client.request({
      server: this.options.server,
      action: "mapTicketToCodebase",
      payload: {
        workspaceRoot: this.options.workspaceRoot,
        ticket
      }
    });

    return {
      repoTarget: response.repoTarget ?? response.repo_target ?? ticket.repoTarget ?? "BPOFH",
      area: response.area ?? response.scope ?? "unknown",
      inScope: response.inScope ?? response.in_scope ?? false,
      feasibility: response.feasibility ?? "feasible",
      confidence: response.confidence ?? 0.5,
      hints: response.hints ?? [],
      implementationHint: response.implementationHint ?? response.implementation_hint ?? "",
      blockers: response.blockers ?? [],
      recheckConditions: response.recheckConditions ?? response.recheck_conditions ?? []
    };
  }
}
