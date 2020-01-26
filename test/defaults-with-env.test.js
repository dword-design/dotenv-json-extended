import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import expect from 'expect'
import outputFiles from 'output-files'

export default () => withLocalTmpDir(async () => {
  delete process.env.FOO
  await outputFiles({
    '.env': 'FOO=baz',
    '.env.defaults': 'FOO=bar',
    '.env.schema': 'FOO=',
  })
  dotenv.config()
  expect(process.env.FOO).toEqual('baz')
})