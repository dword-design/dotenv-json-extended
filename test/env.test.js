import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import outputFiles from 'output-files'

export default () => withLocalTmpDir(async () => {
  delete process.env.FOO
  await outputFiles({
    '.env': 'FOO=bar',
    '.env.schema': 'FOO=',
  })
  dotenv.config()
  expect(process.env.FOO).toEqual('bar')
})
