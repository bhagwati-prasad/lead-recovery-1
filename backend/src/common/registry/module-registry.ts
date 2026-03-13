export class ModuleRegistry<TModule = unknown> {
  private readonly entries = new Map<string, { module: TModule; tags: string[] }>();

  register(id: string, module: TModule, tags: string[] = []): void {
    this.entries.set(id, { module, tags });
  }

  get<TExpected extends TModule>(id: string): TExpected {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Module not found: ${id}`);
    }
    return entry.module as TExpected;
  }

  getAll(tag?: string): TModule[] {
    return [...this.entries.values()]
      .filter((entry) => (tag === undefined ? true : entry.tags.includes(tag)))
      .map((entry) => entry.module);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }
}