import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'
import { outputFile } from 'fs-extra'

export default () => withLocalTmpDir(async () => {
  delete process.env.FOO
  await outputFile('.env', 'FOO=bar')
  expect(dotenv.config).toThrow('EXTRA CONFIG VALUES: FOO')
})
