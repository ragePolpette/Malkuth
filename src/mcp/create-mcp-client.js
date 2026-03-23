import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

class FixtureMcpClient {
  constructor({ fixtures = {}, fixtureFile = "" } = {}) {
    this.fixtures = fixtures;
    this.fixtureFile = fixtureFile;
    this.cache = null;
  }

  async loadFixtures() {
    if (this.cache) {
      return this.cache;
    }

    if (this.fixtureFile) {
      const raw = await readFile(this.fixtureFile, "utf8");
      this.cache = JSON.parse(raw);
      return this.cache;
    }

    this.cache = this.fixtures;
    return this.cache;
  }

  async request({ server, action, payload }) {
    const fixtures = await this.loadFixtures();
    const baseKey = `${server}.${action}`;
    const phaseKey = payload?.phase ? `${baseKey}.${payload.phase}` : null;
    const key = phaseKey && phaseKey in fixtures ? phaseKey : baseKey;
    if (!(key in fixtures)) {
      throw new Error(`Missing MCP fixture response for ${key}`);
    }

    return fixtures[key];
  }
}

class ExternalCommandMcpClient {
  constructor({ command = "", args = [] } = {}) {
    this.command = command;
    this.args = args;
  }

  async request(request) {
    if (!this.command) {
      throw new Error("MCP external command bridge is not configured");
    }

    return new Promise((resolve, reject) => {
      const child = spawn(this.command, this.args, {
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`MCP bridge failed (${code}): ${stderr || stdout}`));
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(error);
        }
      });

      child.stdin.write(JSON.stringify(request));
      child.stdin.end();
    });
  }
}

export function createMcpClient(config = {}) {
  if (config.mode === "fixture") {
    return new FixtureMcpClient(config);
  }

  if (config.mode === "external") {
    return new ExternalCommandMcpClient(config);
  }

  throw new Error(`Unsupported MCP bridge mode: ${config.mode}`);
}
