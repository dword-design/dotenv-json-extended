import findUp from 'find-up'
import { constantCase } from 'constant-case'
import { keys, identity, pickBy, mapValues, mapKeys } from '@dword-design/functions'
import Ajv from 'ajv'
import parseValue from './parse-value'

const ajv = new Ajv({ useDefaults: true })

export default {
  config: () => {
    const envPath = findUp.sync(process.env.NODE_ENV === 'test' ? '.test.env.json' : '.env.json')
    const schemaPath = findUp.sync('.env.schema.json')
    const testSchemaPath = process.env.NODE_ENV === 'test' ? findUp.sync('.test.env.schema.json') : undefined

    const properties = {
      ...schemaPath ? require(schemaPath) : {},
      ...testSchemaPath ? require(testSchemaPath) : {},
    }

    const env = {
      ...envPath !== undefined ? require(envPath) : {},
      ...properties
        |> mapValues(({ type }, name) => {
          try {
            return process.env[name |> constantCase] |> parseValue(type)
          } catch ({ message }) {
            throw new Error(`Error at data.${name}: ${message}`)
          }
        })
        |> pickBy(identity),
    }
    
    const schema = {
      type: 'object',
      properties,
      required: properties |> keys,
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
        |> mapKeys((value, key) => key |> constantCase)
        |> mapValues(value => typeof value === 'object' ? (value |> JSON.stringify) : value),
    )
  },
}