import findUp from 'find-up'
import safeRequire from 'safe-require'
import { constantCase } from 'constant-case'
import { forIn, keys } from '@dword-design/functions'
import Ajv from 'ajv'

const ajv = new Ajv({ useDefaults: true })

export default {
  config: () => {
    const envPath = findUp.sync('.env.json')
    const schemaPath = findUp.sync('.env.schema.json')

    const env = envPath !== undefined ? safeRequire(envPath) : {}
    const loadedSchema = schemaPath !== undefined ? safeRequire(schemaPath) : {}
    const schema = {
      type: 'object',
      properties: loadedSchema,
      required: loadedSchema |> keys,
      additionalProperties: false,
    }

    if (schema !== undefined) {
      const valid = ajv.validate(schema, env)
      if (!valid) {
        throw new Error(`dotenv: ${ajv.errorsText()}`)
      }
    }
    env
      |> forIn((value, key) => {
        const envKey = key |> constantCase
        if (process.env[envKey] === undefined) {
          process.env[envKey] = typeof value === 'object'
            ? JSON.stringify(value)
            : value
        }
      })
  },
}