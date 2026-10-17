import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

function step(name: string): string {
  const section = workflow.split(/^ {6}- name: /m).find((value) => value.split(/\r?\n/)[0] === name);
  if (!section) throw new Error(`Missing CI step: ${name}`);
  return section;
}

function expectRequired(section: string): void {
  expect(section).not.toMatch(/continue-on-error|^\s*if:|\|\|/m);
  expect(workflow).not.toMatch(/continue-on-error:\s*true/);
}

describe('CI security gates', () => {
  it('excludes local verification copies from Git, lint and test discovery', () => {
    const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
    expect(read('.gitignore')).toContain('/.deploy/');
    expect(read('eslint.config.mjs')).toContain("'.deploy/**'");
    expect(read('vitest.config.ts')).toContain("'.deploy/**'");
    expect(read('vitest.config.ts')).toContain('...configDefaults.exclude');
    expect(read('eslint.config.mjs')).toContain('tsconfigRootDir: import.meta.dirname');
  });

  it('uses the reviewed Node 22 runtime from one version file', () => {
    const version = readFileSync(new URL('../../.node-version', import.meta.url), 'utf8').trim();
    expect(version).toBe('22.23.3');
    expect(step('Set up Node.js')).toMatch(/node-version-file:\s*\.node-version/);
  });

  it('locks the approved security fixes without adding runtime dependencies', () => {
    const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      overrides: Record<string, string>;
      dependencies: Record<string, string>;
    };
    const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8')) as {
      packages: Record<string, { version?: string; dev?: boolean }>;
    };
    for (const [name, version] of Object.entries({ 'brace-expansion': '5.0.12', 'source-map-js': '1.2.2' })) {
      expect(manifest.overrides[name]).toBe(version);
      expect(manifest.dependencies[name]).toBeUndefined();
      expect(lock.packages[`node_modules/${name}`].version).toBe(version);
      expect(lock.packages[`node_modules/${name}`].dev).toBe(true);
    }
  });

  it('fetches the full Git history for branches and tags', () => {
    expect(step('Check out repository')).toMatch(/fetch-depth:\s*0(?:\s|$)/);
  });

  it('requires a redacted scan of every available Git ref', () => {
    const scan = step('Scan Git history for secrets');
    expect(scan).toContain('git /repo --redact=100 --no-banner --log-opts="--all --full-history -m" --exit-code=1');
    expectRequired(scan);
  });

  it.each([
    ['Audit production dependencies', '--omit=dev'],
    ['Audit development dependencies', '--include=dev'],
  ])('requires %s before tests and builds', (name, scope) => {
    const audit = step(name);
    expect(audit).toContain(`npm audit ${scope} --audit-level=high`);
    expect(audit).not.toContain('--ignore');
    expect(workflow.indexOf(`- name: ${name}`)).toBeLessThan(workflow.indexOf('- name: Verify application'));
    expectRequired(audit);
  });
});
