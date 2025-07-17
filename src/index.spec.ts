import pathLib from 'node:path';

import { test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';

test('empty', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'cli.ts'),
    endent`
      import self from '../../src';

      self.config();
    `,
  );

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('execute twice', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: [1] }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'array' } }),
    'cli.ts': endent`
      import self from '../../src';

      self.config();
      self.config();
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = 'bar';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable in test', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import self from '../../src';

      process.env.FOO = 'bar'

      self.config();
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: 'test' } });
});

test('existing variable in env with .test.env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'bar2' }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = 'bar'

      self.config();

      expect(process.env.FOO).toEqual('bar2')
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: 'test' } });
});

test('existing variable invalid json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({
      foo: { properties: { bar: { type: 'string' } }, type: 'object' },
    }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = 'foo';

      expect(self.config).toThrow(
        new Error("Error at data.foo: Unexpected token 'o', \\"foo\\" is not valid JSON"),
      );
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({
      foo: { properties: { bar: { type: 'string' } }, type: 'object' },
    }),
    'cli.ts': endent`
      import self from '../../src';

      process.env.FOO = JSON.stringify({ foo: 'bar' });

      self.config();
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable with .env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'baz' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = 'bar';

      self.config();

      expect(process.env.FOO).toEqual('baz');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable without .env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = 'bar';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('inner json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: { bar: 'baz' } }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'object' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      self.config();

      expect(typeof process.env.FOO).toEqual('string');
      expect(JSON.parse(process.env.FOO)).toEqual({ bar: 'baz' });
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('other existing variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = 'bar';
      process.env.BAR = 'bar';

      self.config();
      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('parent folder', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'test' }),
    '.env.schema.json': JSON.stringify({
      bar: { default: 'test2', type: 'string' },
      foo: { type: 'string' },
    }),
    'inner/cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../../src';

      self.config();

      expect(process.env.FOO).toEqual('test');
      expect(process.env.BAR).toEqual('test2');
    `,
  });

  await execaCommand('tsx cli.ts', {
    cwd: pathLib.join(cwd, 'inner'),
    env: { NODE_ENV: '' },
  });
});

test('schema: defaults', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({
      foo: { default: 'bar', type: 'string' },
    }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      self.config();
      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('schema: defaults overwritten', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'baz' }),
    '.env.schema.json': JSON.stringify({
      foo: { default: 'bar', type: 'string' },
    }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      self.config();
      expect(process.env.FOO).toEqual('baz');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('schema: extra variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'bar' }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      expect(self.config).toThrow(
        'dotenv: data must NOT have additional properties',
      );
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('schema: missing variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      expect(self.config).toThrow(
        "dotenv: data must have required property 'foo'",
      );
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('schema: wrong type', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 1 }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      expect(self.config).toThrow('dotenv: data/foo must be string');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('env', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'bar' }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: 'test' } });
});

test('env and .env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'bar' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      expect(self.config).toThrow(
        "dotenv: data must have required property 'foo'",
      );
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: 'test' } });
});

test('valid', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'bar' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('empty string for number', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({
      foo: { default: 3000, type: 'number' },
    }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      process.env.FOO = '';

      self.config();

      expect(process.env.FOO).toEqual('3000');
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});

test('no type', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: {} }),
    'cli.ts': endent`
      import { expect } from '@playwright/test';

      import self from '../../src';

      expect(self.config).toThrow("dotenv: data must have required property 'foo'");
    `,
  });

  await execaCommand('tsx cli.ts', { cwd, env: { NODE_ENV: '' } });
});
