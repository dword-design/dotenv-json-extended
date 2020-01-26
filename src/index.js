import dotenvExtended from 'dotenv-extended'
import findUp from 'find-up'

export default {
  config: options => dotenvExtended.load({
    path: findUp.sync('.env'),
    defaults: findUp.sync('.env.defaults'),
    schema: findUp.sync('.env.schema'),
    errorOnMissing: true, 
    errorOnExtra: true,
    ...options,
  }),
}