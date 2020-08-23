import {
  identity,
  keys,
  mapKeys,
  mapValues,
  pickBy,
} from '@dword-design/functions'
import Ajv from 'ajv'
import { constantCase } from 'constant-case'
import findUp from 'find-up'
import { readJsonSync } from 'fs-extra'

import parseValue from './parse-value'

const ajv = new Ajv({ useDefaults: true })

export default {
  config: () => {
    const envPath = findUp.sync(
      process.env.NODE_ENV === 'test' ? '.test.env.json' : '.env.json'
    )
    const schemaPath = findUp.sync('.env.schema.json')
    const properties = schemaPath ? readJsonSync(schemaPath) : {}
    const env = {
      ...(properties
        |> mapValues((property, name) => {
          try {
            return (
              process.env[name |> constantCase] |> parseValue(property.type)
            )
          } catch (error) {
            throw new Error(`Error at data.${name}: ${error.message}`)
          }
        })
        |> pickBy(identity)),
      ...(envPath && readJsonSync(envPath)),
    }
    const schema = {
      additionalProperties: false,
      properties,
      required: properties |> keys,
      type: 'object',
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
        |> mapKeys((value, key) => key |> constantCase)
        |> mapValues(value =>
          typeof value === 'object' ? value |> JSON.stringify : value
        )
    )
  },
}
