import Ajv from 'ajv';
import { constantCase } from 'change-case';
import { findUpSync } from 'find-up';
import fs from 'fs-extra';
import mapObj from 'map-obj';

import parseValue from './parse-value';

// TODO: Should be exported from ajv
interface JsonSchemaProperty {
  type?: string;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  [key: string]: unknown;
}
const ajv = new Ajv({ useDefaults: true });

const parse = ({ cwd = '.' } = {}) => {
  const schemaPath = findUpSync('.env.schema.json', { cwd });

  const filePath = findUpSync(
    process.env.NODE_ENV === 'test' ? '.test.env.json' : '.env.json',
    { cwd },
  );

  const fromFile: Record<string, unknown> = filePath
    ? fs.readJsonSync(filePath)
    : {};

  const properties: Record<string, JsonSchemaProperty> = schemaPath
    ? fs.readJsonSync(schemaPath)
    : {};

  const fromEnv = mapObj(properties, (name, property) => {
    const valueString = process.env[constantCase(name)];
    let value;

    try {
      value = parseValue(valueString, property.type);
    } catch (error) {
      throw new Error(`Error at data.${name}: ${error.message}`);
    }

    return [name, value];
  });

  const fromAll = { ...fromEnv, ...fromFile };

  const schema = {
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
    type: 'object',
  };

  const valid = ajv.validate(schema, fromAll);

  if (!valid) {
    throw new Error(`dotenv: ${ajv.errorsText()}`);
  }

  return mapObj(fromAll, (name, value) => [
    constantCase(String(name)),
    typeof value === 'object' ? JSON.stringify(value) : value,
  ]);
};

export default {
  config: ({ cwd = '.' } = {}) => Object.assign(process.env, parse({ cwd })),
  parse,
};
