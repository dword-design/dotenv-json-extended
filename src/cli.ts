#!/usr/bin/env node

import { execa } from 'execa';
import makeCli from 'make-cli';

import api from '.';

try {
  await makeCli({
    action: (options, command) =>
      execa(command.args[0], command.args.slice(1), {
        env: api.parse(),
        stdio: 'inherit',
      }),
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
