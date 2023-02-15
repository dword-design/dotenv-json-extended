import { omit } from '@dword-design/functions'
import { outputFile } from 'fs-extra'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

import self from './index.js'

let oldEnv

export default {
  after: () => {
    process.env = oldEnv
  },
  before: () => {
    oldEnv = process.env
  },
  beforeEach: () => {
    process.env = { ...oldEnv, NODE_ENV: 'development' }
  },
  empty: () => withLocalTmpDir(() => self.config()),
  'execute twice': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        '.env.json':
          {
            foo: [1],
          } |> JSON.stringify,
        '.env.schema.json':
          {
            foo: { type: 'array' },
          } |> JSON.stringify,
      })
      self.config()
      self.config()
    }),
  'existing variable': () =>
    withLocalTmpDir(async () => {
      process.env.FOO = 'bar'
      await outputFile(
        '.env.schema.json',
        { foo: { type: 'string' } } |> JSON.stringify
      )
      self.config()
      expect(process.env.FOO).toEqual('bar')
    }),
  'existing variable in test env': () =>
    withLocalTmpDir(async () => {
      process.env.NODE_ENV = 'test'
      process.env.TEST_FOO = 'bar'
      await outputFiles({
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
      })
      self.config()
    }),
  'existing variable in test env with .test.env.json': () =>
    withLocalTmpDir(async () => {
      process.env.NODE_ENV = 'test'
      process.env.TEST_FOO = 'bar'
      await outputFiles({
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        '.test.env.json': { foo: 'bar2' } |> JSON.stringify,
      })
      self.config()
      expect(process.env.FOO).toEqual('bar2')
    }),
  'existing variable invalid json': () =>
    withLocalTmpDir(async () => {
      process.env.FOO = 'foo'
      await outputFile(
        '.env.schema.json',
        {
          foo: {
            properties: { bar: { type: 'string' } },
            type: 'object',
          },
        } |> JSON.stringify
      )
      expect(self.config).toThrow(
        new Error('Error at data.foo: Unexpected token o in JSON at position 1')
      )
    }),
  'existing variable json': () =>
    withLocalTmpDir(async () => {
      process.env.FOO = JSON.stringify({ foo: 'bar' })
      await outputFile(
        '.env.schema.json',
        {
          foo: {
            properties: { bar: { type: 'string' } },
            type: 'object',
          },
        } |> JSON.stringify
      )
      self.config()
    }),
  'existing variable with .env.json': () =>
    withLocalTmpDir(async () => {
      process.env.FOO = 'bar'
      await outputFiles({
        '.env.json': { foo: 'baz' } |> JSON.stringify,
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
      })
      self.config()
      expect(process.env.FOO).toEqual('baz')
    }),
  'existing variable without .env.json': () =>
    withLocalTmpDir(async () => {
      process.env.FOO = 'bar'
      await outputFile(
        '.env.schema.json',
        { foo: { type: 'string' } } |> JSON.stringify
      )
      self.config()
      expect(process.env.FOO).toEqual('bar')
    }),
  'inner json': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        '.env.json': { foo: { bar: 'baz' } } |> JSON.stringify,
        '.env.schema.json': { foo: { type: 'object' } } |> JSON.stringify,
      })
      self.config()
      expect(typeof process.env.FOO).toEqual('string')
      expect(process.env.FOO |> JSON.parse).toEqual({ bar: 'baz' })
    }),
  'other existing variable': () =>
    withLocalTmpDir(async () => {
      process.env.FOO = 'bar'
      process.env.BAR = 'bar'
      await outputFile(
        '.env.schema.json',
        { foo: { type: 'string' } } |> JSON.stringify
      )
      self.config()
      expect(process.env.FOO).toEqual('bar')
    }),
  'parent folder': () =>
    withLocalTmpDir(async () => {
      process.env = process.env |> omit(['FOO', 'BAR'])
      await outputFiles({
        '.env.json': { foo: 'test' } |> JSON.stringify,
        '.env.schema.json':
          {
            bar: { default: 'test2', type: 'string' },
            foo: { type: 'string' },
          } |> JSON.stringify,
        inner: {},
      })
      process.chdir('inner')
      self.config()
      expect(process.env.FOO).toEqual('test')
      expect(process.env.BAR).toEqual('test2')
    }),
  'schema: defaults': () =>
    withLocalTmpDir(async () => {
      await outputFile(
        '.env.schema.json',
        { foo: { default: 'bar', type: 'string' } } |> JSON.stringify
      )
      self.config()
      expect(process.env.FOO).toEqual('bar')
    }),
  'schema: defaults overwritten': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        '.env.json': { foo: 'baz' } |> JSON.stringify,
        '.env.schema.json':
          { foo: { default: 'bar', type: 'string' } } |> JSON.stringify,
      })
      self.config()
      expect(process.env.FOO).toEqual('baz')
    }),
  'schema: extra variable': () =>
    withLocalTmpDir(async () => {
      await outputFile('.env.json', { foo: 'bar' } |> JSON.stringify)
      expect(self.config).toThrow(
        'dotenv: data must NOT have additional properties'
      )
    }),
  'schema: missing variable': () =>
    withLocalTmpDir(async () => {
      await outputFile(
        '.env.schema.json',
        { foo: { type: 'string' } } |> JSON.stringify
      )
      expect(self.config).toThrow(
        "dotenv: data must have required property 'foo'"
      )
    }),
  'schema: wrong type': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        '.env.json': { foo: 1 } |> JSON.stringify,
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
      })
      expect(self.config).toThrow('dotenv: data/foo must be string')
    }),
  'test env': () =>
    withLocalTmpDir(async () => {
      process.env.NODE_ENV = 'test'
      await outputFiles({
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        '.test.env.json': { foo: 'bar' } |> JSON.stringify,
      })
      self.config()
      expect(process.env.FOO).toEqual('bar')
    }),
  'test env and .env.json': () =>
    withLocalTmpDir(async () => {
      process.env.NODE_ENV = 'test'
      await outputFiles({
        '.env.json': { foo: 'bar' } |> JSON.stringify,
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
      })
      expect(self.config).toThrow(
        "dotenv: data must have required property 'foo'"
      )
    }),
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        '.env.json': { foo: 'bar' } |> JSON.stringify,
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
      })
      self.config()
      expect(process.env.FOO).toEqual('bar')
    }),
}
