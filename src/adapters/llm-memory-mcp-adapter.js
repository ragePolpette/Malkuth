import { createMemoryRecord, normalizeMemoryRecord } from "../contracts/memory-record.js";

export class McpLlmMemoryAdapter {
  constructor(options = {}) {
    this.options = options;
    this.client = options.client;
    this.kind = "mcp";
  }

  async listRecords() {
    const response = await this.client.request({
      server: this.options.server,
      action: "listTicketMemoryRecords",
      payload: {
        namespace: this.options.namespace
      }
    });

    const records = Array.isArray(response?.records) ? response.records : response;
    return records.map(normalizeMemoryRecord);
  }

  async upsertRecords(records) {
    const payloadRecords = records.map(createMemoryRecord);
    const response = await this.client.request({
      server: this.options.server,
      action: "upsertTicketMemoryRecords",
      payload: {
        namespace: this.options.namespace,
        records: payloadRecords
      }
    });

    const saved = Array.isArray(response?.records) ? response.records : payloadRecords;
    return saved.map(normalizeMemoryRecord);
  }
}
