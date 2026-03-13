import { ModuleRegistry } from 'src/common/registry/module-registry';

describe('ModuleRegistry', () => {
  it('registers and resolves modules', () => {
    const registry = new ModuleRegistry<object>();
    const moduleRef = { id: 'test-module' };

    registry.register('test-module', moduleRef, ['workflow']);

    expect(registry.has('test-module')).toBe(true);
    expect(registry.get('test-module')).toBe(moduleRef);
  });

  it('filters modules by tag', () => {
    const registry = new ModuleRegistry<object>();
    registry.register('workflow-module', { kind: 'workflow' }, ['workflow']);
    registry.register('utility-module', { kind: 'utility' }, ['utility']);

    expect(registry.getAll('workflow')).toHaveLength(1);
    expect(registry.getAll()).toHaveLength(2);
  });

  it('throws for unknown modules', () => {
    const registry = new ModuleRegistry<object>();

    expect(() => registry.get('unknown')).toThrow('Module not found');
  });
});
