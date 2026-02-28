#!/usr/bin/env node

import { execa } from 'execa';
import makeCli from 'make-cli';

import api from '.';

await makeCli({
  action: (options, command) => {
    const envVariables = api.parse();

    if (command.args.length === 0) {
      return;
    }

    // Source: https://github.com/entropitor/dotenv-cli/blob/master/cli.js#L114
    // Parent and child need to be aligned e.g. for pm2 reloads
    // Also see https://dotenvx.com/docs/process-managers/pm2
    // Also see https://github.com/dotenvx/dotenvx/blob/main/src/lib/helpers/executeCommand.js
    // TODO: Make the parent-child syncing cleaner
    const child = execa(command.args[0], command.args.slice(1), {
      env: envVariables,
      stdio: 'inherit',
    }).on('exit', (exitCode, signal) => {
      if (typeof exitCode === 'number') {
        process.exit(exitCode);
      } else {
        process.kill(process.pid, signal || undefined);
      }
    });

    for (const signal of [
      'SIGINT',
      'SIGTERM',
      'SIGPIPE',
      'SIGHUP',
      'SIGBREAK',
      'SIGWINCH',
      'SIGUSR1',
      'SIGUSR2',
    ] as const) {
      process.on(signal, () => {
        child.kill(signal);
      });
    }

    return child;
  },
});
