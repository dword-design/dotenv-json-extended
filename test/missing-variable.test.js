import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import { outputFile } from 'fs-extra'

export default () => withLocalTmpDir(async () => {
  delete process.env.FOO
  await outputFile('.env.schema', 'FOO=')
  expect(dotenv.config).toThrow('MISSING CONFIG VALUES: FOO')
})
