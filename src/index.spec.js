import pathLib from 'node:path';

import { test } from '@playwright/test';
import dedent from 'dedent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';
import nodeVersion from 'node-version':

test('empty', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'cli.js'),
    dedent`
    import self from '../../src/index.js';

    self.config();
  `,
  );

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('execute twice', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: [1] }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'array' } }),
    'cli.js': dedent`
      import self from '../../src/index.js';

      self.config();
      self.config();
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      process.env.FOO = 'bar';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable in test', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import self from '../../src/index.js';

      process.env.TEST_FOO = 'bar'

      self.config();
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: 'test' } });
});

test('existing variable in test env with .test.env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'bar2' }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      process.env.TEST_FOO = 'bar'

      self.config();

      expect(process.env.FOO).toEqual('bar2')
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: 'test' } });
});

test('existing variable invalid json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({
      foo: { properties: { bar: { type: 'string' } }, type: 'object' },
    }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      process.env.FOO = 'foo';

      expect(self.config).toThrow(
        new Error(
          nodeVersion.major <= 18 ? 'Error at data.foo: Unexpected token o in JSON at position 1' : "Error at data.foo: Unexpected token 'o', \"foo\" is not valid JSON",
        ),
      );
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({
      foo: { properties: { bar: { type: 'string' } }, type: 'object' },
    }),
    'cli.js': dedent`
      import self from '../../src/index.js';

      process.env.FOO = JSON.stringify({ foo: 'bar' });

      self.config();
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable with .env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'baz' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      process.env.FOO = 'bar';

      self.config();

      expect(process.env.FOO).toEqual('baz');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('existing variable without .env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      process.env.FOO = 'bar';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('inner json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: { bar: 'baz' } }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'object' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      self.config();

      expect(typeof process.env.FOO).toEqual('string');
      expect(JSON.parse(process.env.FOO)).toEqual({ bar: 'baz' });
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('other existing variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      process.env.FOO = 'bar';
      process.env.BAR = 'bar';
      
      self.config();
      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('parent folder', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'test' }),
    '.env.schema.json': JSON.stringify({
      bar: { default: 'test2', type: 'string' },
      foo: { type: 'string' },
    }),
    'inner/cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../../src/index.js';

      self.config();

      expect(process.env.FOO).toEqual('test');
      expect(process.env.BAR).toEqual('test2');
    `,
  });

  await execaCommand('node cli.js', {
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
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      self.config();
      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('schema: defaults overwritten', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'baz' }),
    '.env.schema.json': JSON.stringify({
      foo: { default: 'bar', type: 'string' },
    }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      self.config();
      expect(process.env.FOO).toEqual('baz');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('schema: extra variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'bar' }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      expect(self.config).toThrow(
        'dotenv: data must NOT have additional properties',
      );
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('schema: missing variable', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      expect(self.config).toThrow(
        "dotenv: data must have required property 'foo'",
      );
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('schema: wrong type', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 1 }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      expect(self.config).toThrow('dotenv: data/foo must be string');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});

test('env', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'bar' }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: 'test' } });
});

test('env and .env.json', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'bar' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      expect(self.config).toThrow(
        "dotenv: data must have required property 'foo'",
      );
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: 'test' } });
});

test('valid', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'bar' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    'cli.js': dedent`
      import { expect } from '@playwright/test';

      import self from '../../src/index.js';

      self.config();

      expect(process.env.FOO).toEqual('bar');
    `,
  });

  await execaCommand('node cli.js', { cwd, env: { NODE_ENV: '' } });
});
