import findUp from 'find-up'
import safeRequire from 'safe-require'
import { constantCase } from 'constant-case'
import { keys, zipObject, map, identity, pickBy, mapValues, mapKeys } from '@dword-design/functions'
import Ajv from 'ajv'

const ajv = new Ajv({ useDefaults: true })

export default {
  config: () => {
    const envPath = findUp.sync('.env.json')
    const schemaPath = findUp.sync('.env.schema.json')

    const properties = schemaPath !== undefined ? safeRequire(schemaPath) : {}
    const propertyNames = properties |> keys
    const env = {
      ...envPath !== undefined ? safeRequire(envPath) : {},
      ...zipObject(
        propertyNames,
        propertyNames |> map(propertyName => process.env[propertyName |> constantCase]),
      )
        |> pickBy(identity),
    }
    
    const schema = {
      type: 'object',
      properties,
      required: propertyNames,
      additionalProperties: false,
    }

    if (schema !== undefined) {
      const valid = ajv.validate(schema, env)
      if (!valid) {
        throw new Error(`dotenv: ${ajv.errorsText()}`)
      }
    }
    
    Object.assign(
      process.env,
      env
        |> mapValues(value => typeof value === 'object' ? (value |> JSON.stringify) : value)
        |> mapKeys((value, key) => key |> constantCase),
    )
  },
}