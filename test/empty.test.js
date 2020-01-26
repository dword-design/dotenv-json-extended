import withLocalTmpDir from 'with-local-tmp-dir'
import dotenv from '@dword-design/dotenv'

export default () => withLocalTmpDir(() => dotenv.config())