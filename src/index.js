import {
  identity,
  keys,
  mapKeys,
  mapValues,
  pickBy,
} from '@dword-design/functions'
import Ajv from 'ajv'
import { constantCase } from 'constant-case'
import { findUpSync } from 'find-up'
import fs from 'fs-extra'

import parseValue from './parse-value.js'

const ajv = new Ajv({ useDefaults: true })

export default {
  config: () => {
    const envPath = findUpSync(
      process.env.NODE_ENV === 'test' ? '.test.env.json' : '.env.json'
    )

    const schemaPath = findUpSync('.env.schema.json')

    const properties = schemaPath ? fs.readJsonSync(schemaPath) : {}

    const env = {
      ...(properties
        |> mapValues((property, name) => {
          try {
            return (
              process.env[
                `${process.env.NODE_ENV === 'test' ? 'TEST_' : ''}${
                  name |> constantCase
                }`
              ] |> parseValue(property.type)
            )
          } catch (error) {
            throw new Error(`Error at data.${name}: ${error.message}`)
          }
        })
        |> pickBy(identity)),
      ...(envPath && fs.readJsonSync(envPath)),
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
