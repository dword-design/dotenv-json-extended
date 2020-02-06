import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import outputFiles from 'output-files'

export default () => withLocalTmpDir(async () => {
  process.env.FOO = 'bar'
  await outputFiles({
    '.env': 'FOO=baz',
    '.env.schema': 'FOO=',
  })
  dotenv.config({ overrideProcessEnv: true })
  expect(process.env.FOO).toEqual('baz')
})
