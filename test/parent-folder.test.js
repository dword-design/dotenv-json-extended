import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import outputFiles from 'output-files'
import { omit, endent } from '@dword-design/functions'

export default () => withLocalTmpDir(async () => {
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
})
