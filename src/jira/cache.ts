import { IntegrationCache } from "@jupiterone/jupiter-managed-integration-sdk";
import { Resource } from "./types";

export interface JiraCacheEntry<T> {
  key: string;
  data?: T;
}

export class JiraCache<T extends Resource> {
  constructor(readonly resource: string, readonly cache: IntegrationCache) {}

  public async putIds(ids: string[]) {
    return this.cache.putEntry({ key: this.resource + "Ids", data: ids });
  }

  public async getIds() {
    const entry = await this.cache.getEntry(this.resource + "Ids");
    if (entry) {
      return entry.data as string[];
    }
  }

  public async putResources(resources: T[]) {
    const entries = resources.map(r => ({
      key: this.resource + r.id,
      data: r,
    }));
    return this.cache.putEntries(entries);
  }

  public async getResources(ids: string[]) {
    const keys = ids.map(i => this.resource + i);
    const entries = await this.cache.getEntries(keys);
    return entries.map(entry => entry.data) as T[];
  }

  public async recordSuccess() {
    const successes = await this.fetchSuccesses();
    return this.cache.putEntry({
      key: "fetchSuccess",
      data: [...successes, `${this.resource}s`],
    });
  }

  public async fetchSuccess() {
    return (await this.fetchSuccesses()).includes(`${this.resource}s`);
  }

  protected async fetchSuccesses(): Promise<string[]> {
    const success = await this.cache.getEntry("fetchSuccess");
    return success.data || [];
  }
}
