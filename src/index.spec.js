import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import outputFiles from 'output-files'
import { outputFile } from 'fs-extra'
import { endent, omit } from '@dword-design/functions'

export default {
  'defaults with env': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env': 'FOO=baz',
      '.env.defaults': 'FOO=bar',
      '.env.schema': 'FOO=',
    })
    dotenv.config()
    expect(process.env.FOO).toEqual('baz')
  }),
  defaults: () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env.defaults': 'FOO=bar',
      '.env.schema': 'FOO=',
    })
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  'dotenv extended options': () => withLocalTmpDir(async () => {
    process.env.FOO = 'bar'
    await outputFiles({
      '.env': 'FOO=baz',
      '.env.schema': 'FOO=',
    })
    dotenv.config({ overrideProcessEnv: true })
    expect(process.env.FOO).toEqual('baz')
  }),
  empty: () => withLocalTmpDir(() => dotenv.config()),
  env: () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFiles({
      '.env': 'FOO=bar',
      '.env.schema': 'FOO=',
    })
    dotenv.config()
    expect(process.env.FOO).toEqual('bar')
  }),
  'extra variable': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFile('.env', 'FOO=bar')
    expect(dotenv.config).toThrow('EXTRA CONFIG VALUES: FOO')
  }),
  'missing variable': () => withLocalTmpDir(async () => {
    delete process.env.FOO
    await outputFile('.env.schema', 'FOO=')
    expect(dotenv.config).toThrow('MISSING CONFIG VALUES: FOO')
  }),
  'parent folder': () => withLocalTmpDir(async () => {
    process.env = process.env |> omit(['FOO', 'BAR'])
    await outputFiles({
      inner: {},
      '.env': 'FOO=test',
      '.env.defaults': 'BAR=test2',
      '.env.schema': endent`
        FOO=
        BAR=
      `,
    })
    process.chdir('inner')
    dotenv.config()
    expect(process.env.FOO).toEqual('test')
    expect(process.env.BAR).toEqual('test2')
  }),
}
