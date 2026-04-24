/**
 * Tests for global variable merge with YAML defaults in build actions.
 *
 * Tests the merge strategy: global variables from instance settings
 * override per-action YAML defaults when both define the same name.
 */

import { describe, it, expect } from 'vitest';

/**
 * Reimplements the merge logic from WorkspaceService.mergeGlobalVariables()
 * to test it in isolation without needing a full WorkspaceService instance.
 */
function mergeVariables(
  yamlVars: Array<{ name: string; value: string }> | undefined,
  globalVars: Record<string, string> | undefined
): Array<{ name: string; value: string }> {
  const mergedMap = new Map<string, string>();

  // Add YAML defaults first
  if (yamlVars) {
    for (const v of yamlVars) {
      mergedMap.set(v.name, v.value);
    }
  }

  // Global overrides win
  if (globalVars) {
    for (const [name, value] of Object.entries(globalVars)) {
      mergedMap.set(name, value);
    }
  }

  return Array.from(mergedMap.entries()).map(([name, value]) => ({ name, value }));
}

describe('Build Action Variable Merge', () => {
  it('global variable overrides YAML default', () => {
    const yamlVars = [{ name: 'NIX_EXEC', value: '/usr/bin/nix' }];
    const globalVars = { NIX_EXEC: '/run/current-system/sw/bin/nix' };

    const result = mergeVariables(yamlVars, globalVars);

    expect(result).toEqual([
      { name: 'NIX_EXEC', value: '/run/current-system/sw/bin/nix' },
    ]);
  });

  it('YAML variable used when no global override exists', () => {
    const yamlVars = [{ name: 'MY_VAR', value: 'default_value' }];
    const globalVars = {};

    const result = mergeVariables(yamlVars, globalVars);

    expect(result).toEqual([
      { name: 'MY_VAR', value: 'default_value' },
    ]);
  });

  it('global-only variable is included', () => {
    const yamlVars: Array<{ name: string; value: string }> = [];
    const globalVars = { EXTRA_VAR: 'extra_value' };

    const result = mergeVariables(yamlVars, globalVars);

    expect(result).toEqual([
      { name: 'EXTRA_VAR', value: 'extra_value' },
    ]);
  });

  it('mixed: some overridden, some only in YAML, some only global', () => {
    const yamlVars = [
      { name: 'SHARED', value: 'yaml_default' },
      { name: 'YAML_ONLY', value: 'yaml_value' },
    ];
    const globalVars = {
      SHARED: 'global_override',
      GLOBAL_ONLY: 'global_value',
    };

    const result = mergeVariables(yamlVars, globalVars);

    const resultMap = new Map(result.map((v) => [v.name, v.value]));
    expect(resultMap.get('SHARED')).toBe('global_override');
    expect(resultMap.get('YAML_ONLY')).toBe('yaml_value');
    expect(resultMap.get('GLOBAL_ONLY')).toBe('global_value');
  });

  it('no variables at all returns empty array', () => {
    const result = mergeVariables(undefined, undefined);
    expect(result).toEqual([]);
  });

  it('undefined global vars uses YAML defaults', () => {
    const yamlVars = [{ name: 'A', value: '1' }];
    const result = mergeVariables(yamlVars, undefined);
    expect(result).toEqual([{ name: 'A', value: '1' }]);
  });
});
