#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const spawn = require('react-dev-utils/crossSpawn');
const chalk = require('react-dev-utils/chalk');
const { readJSONSync } = require('fs-extra');
const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'start' || x === 'test' || x === 'eject'
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

const printScripts = () => console.log("\nScripts:\n\n  init\n  start\n  eject\n  build");

switch (script) {
  case 'build':
  case 'start':
  case 'test':
  case 'eject': {
    const result = spawn.sync(
      'node',
      nodeArgs
        .concat(require.resolve('./scripts/' + script))
        .concat(args.slice(scriptIndex + 1)),
      { stdio: 'inherit' }
    );
    if (result.signal) {
      if (result.signal === 'SIGKILL') {
        console.log(
          'The build failed because the process exited too early. ' +
            'This probably means the system ran out of memory or someone called ' +
            '`kill -9` on the process.'
        );
      } else if (result.signal === 'SIGTERM') {
        console.log(
          'The build failed because the process exited too early. ' +
            'Someone might have called `kill` or `killall`, or the system could ' +
            'be shutting down.'
        );
      }
      process.exit(1);
    }
    process.exit(result.status);
    break;
  }
  case undefined:
    console.log(chalk.cyan("solid-scripts") + chalk.gray("@" + readJSONSync(require.resolve("./package.json")).version));
    printScripts();
    break;
  default:
    console.log('Unknown script "' + script + '".');
    console.log('Perhaps you need to update solid-scripts?');
    printScripts();
    break;
}