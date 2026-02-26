#!/usr/bin/env node

import { execa } from 'execa';
import makeCli from 'make-cli';

import api from '.';

try {
  await makeCli({
    action: (options, command) => {
      const envVariables = api.parse();

      if (command.args.length === 0) {
        return;
      }

      return execa(command.args[0], command.args.slice(1), {
        env: envVariables,
        stdio: 'inherit',
      });
    },
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
