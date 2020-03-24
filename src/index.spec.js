import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv-json-extended'
import outputFiles from 'output-files'
import { outputFile } from 'fs-extra'
import { omit } from '@dword-design/functions'

export default {
  'existing variable': () => withLocalTmpDir(async () => {
    process.env.FOO = 'bar'
    await outputFiles({
      '.env.json': { foo: 'baz' } |> JSON.stringify,
      '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
    })
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  'other existing variable': () => withLocalTmpDir(async () => {
    process.env.FOO = 'bar'
    process.env.BAR = 'bar'
    await outputFile('.env.schema.json', { foo: { type: 'string' } } |> JSON.stringify)
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  'existing variable without .env.json': () => withLocalTmpDir(async () => {
    process.env.FOO = 'bar'
    await outputFile('.env.schema.json', { foo: { type: 'string' } } |> JSON.stringify)
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  empty: () => withLocalTmpDir(() => dotenv.config()),
  valid: () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
      '.env.json': { foo: 'bar' } |> JSON.stringify,
    })
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  'inner json': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env.schema.json': { foo: { type: 'object' } } |> JSON.stringify,
      '.env.json': { foo: { bar: 'baz' } } |> JSON.stringify,
    })
    dotenv.config()
    expect(typeof process.env.FOO).toEqual('string')
    expect(process.env.FOO |> JSON.parse).toEqual({ bar: 'baz' })
  }),
  'schema: defaults overwritten': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env.json': { foo: 'baz' } |> JSON.stringify,
      '.env.schema.json': { foo: { type: 'string', default: 'bar' } } |> JSON.stringify,
    })
    dotenv.config()
    expect(process.env.FOO).toEqual('baz')
  }),
  'schema: defaults': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFile('.env.schema.json', { foo: { type: 'string', default: 'bar' } } |> JSON.stringify)
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  'schema: extra variable': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFile('.env.json', { foo: 'bar' } |> JSON.stringify)
    expect(dotenv.config).toThrow('dotenv: data should NOT have additional properties')
  }),
  'schema: missing variable': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFile('.env.schema.json', { foo: { type: 'string' } } |> JSON.stringify)
    expect(dotenv.config).toThrow('dotenv: data should have required property \'foo\'')
  }),
  'schema: wrong type': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env.json': { foo: 1 } |> JSON.stringify,
      '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
    })
    expect(dotenv.config).toThrow('dotenv: data.foo should be string')
  }),
  'parent folder': () => withLocalTmpDir(async () => {
    process.env = process.env |> omit(['FOO', 'BAR'])
    await outputFiles({
      inner: {},
      '.env.json': { foo: 'test' } |> JSON.stringify,
      '.env.schema.json': {
        foo: { type: 'string' },
        bar: { type: 'string', default: 'test2' },
      }
        |> JSON.stringify,
    })
    process.chdir('inner')
    dotenv.config()
    expect(process.env.FOO).toEqual('test')
    expect(process.env.BAR).toEqual('test2')
  }),
}
