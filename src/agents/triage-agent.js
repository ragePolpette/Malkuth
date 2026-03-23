import { loadPrompt } from "../prompts/load-prompt.js";
import { createMemoryRecord } from "../contracts/memory-record.js";
import { TriageService } from "../triage/triage-service.js";

export class TriageAgent {
  constructor({ contextAdapter, memoryAdapter, sqlDbAdapter }) {
    this.contextAdapter = contextAdapter;
    this.memoryAdapter = memoryAdapter;
    this.sqlDbAdapter = sqlDbAdapter;
    this.service = new TriageService();
  }

  async maybeRunDiagnostics(ticket) {
    const request = ticket.diagnostics?.triage;
    if (!request?.query && !request?.statement) {
      return null;
    }

    return this.sqlDbAdapter.runDiagnosticQuery({
      phase: "triage",
      ticketKey: ticket.key,
      ...request
    });
  }

  applyDiagnostics(mapping, diagnostics) {
    if (!diagnostics?.used) {
      return mapping;
    }

    const hints = [...(mapping.hints ?? [])];
    if (diagnostics.summary) {
      hints.push(`SQL diagnostic: ${diagnostics.summary}`);
    }

    return {
      ...mapping,
      hints,
      blockers: [...(mapping.blockers ?? []), ...(diagnostics.blockers ?? [])],
      implementationHint: [mapping.implementationHint, diagnostics.summary]
        .filter(Boolean)
        .join(" | ")
    };
  }

  async run(tickets) {
    const prompt = await loadPrompt("triage-agent.md");
    const existingMemory = await this.memoryAdapter.listRecords();
    const memoryByTicket = new Map(existingMemory.map((record) => [record.ticket_key, record]));
    const decisions = [];

    for (const ticket of tickets) {
      const diagnostics = await this.maybeRunDiagnostics(ticket);
      const mapping = this.applyDiagnostics(
        await this.contextAdapter.mapTicketToCodebase(ticket),
        diagnostics
      );
      const decision = this.service.evaluate(ticket, {
        prompt,
        mapping,
        memoryByTicket
      });
      decisions.push(decision);
      memoryByTicket.set(ticket.key, createMemoryRecord(decision));
    }

    await this.memoryAdapter.upsertRecords(decisions);

    return decisions;
  }
}
