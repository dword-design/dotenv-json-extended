import Ajv from 'ajv';
import { constantCase } from 'change-case';
import { findUpSync } from 'find-up';
import fs from 'fs-extra';
import { keys } from 'lodash-es';

import parseValue from './parse-value.js';

const ajv = new Ajv({ useDefaults: true });

const parse = () => {
  const schemaPath = findUpSync('.env.schema.json');

  const filePath = findUpSync(
    process.env.NODE_ENV === 'test' ? '.test.env.json' : '.env.json',
  );

  const fromFile = filePath ? fs.readJsonSync(filePath) : {};
  const properties = schemaPath ? fs.readJsonSync(schemaPath) : {};

  const fromEnv = Object.fromEntries(
    Object.entries(properties).map(([name, property]) => {
      const nodeEnvPrefix = process.env.NODE_ENV === 'test' ? 'TEST_' : '';
      const envVariableName = `${nodeEnvPrefix}${constantCase(name)}`;
      const valueString = process.env[envVariableName];
      let value;

      try {
        value = parseValue(valueString, property.type);
      } catch (error) {
        throw new Error(`Error at data.${name}: ${error.message}`);
      }

      return [name, value];
    }),
  );

  const fromAll = { ...fromEnv, ...fromFile };

  const schema = {
    additionalProperties: false,
    properties,
    required: keys(properties),
    type: 'object',
  };

  const valid = ajv.validate(schema, fromAll);

  if (!valid) {
    throw new Error(`dotenv: ${ajv.errorsText()}`);
  }

  return Object.fromEntries(
    Object.entries(fromAll).map(([name, value]) => [
      constantCase(name),
      typeof value === 'object' ? JSON.stringify(value) : value,
    ]),
  );
};

export default { config: () => Object.assign(process.env, parse()), parse };
