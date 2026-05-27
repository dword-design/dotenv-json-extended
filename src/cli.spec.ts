import { expect, test } from '@playwright/test';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

test.describe('run', () => {
  test('works', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await outputFiles(cwd, {
      '.env.json': JSON.stringify({ foo: 'bar' }),
      '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
      'run.js': 'console.log(process.env.FOO);',
    });

    const { stdout } = await execaCommand(
      'tsx ../../src/cli.ts -- node run.js',
      { cwd, env: { NODE_ENV: '' } },
    );

    expect(stdout).toEqual('bar');
  });

  test('no args', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await outputFiles(cwd, {
      '.env.json': JSON.stringify({ foo: 'bar' }),
      '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    });

    await execaCommand('tsx ../../src/cli.ts', { cwd, env: { NODE_ENV: '' } });
  });
});

test.describe('get', () => {
  test('works', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await outputFiles(cwd, {
      '.env.json': JSON.stringify({ foo: 'bar' }),
      '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    });

    const { stdout } = await execaCommand('tsx ../../src/cli.ts get', {
      cwd,
      env: { NODE_ENV: '' },
    });

    expect(stdout).toEqual(JSON.stringify({ FOO: 'bar' }));
  });
});
