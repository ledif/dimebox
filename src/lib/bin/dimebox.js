'use strict'

let argv = require('yargs')
  .usage("Usage: $0 <command> [options]")
  .env("DIMEBOX")
  .commandDir('commands')
  .completion("completion", "Output .bashrc completion script.")
  .example('dimebox generate --machine vulcan exp.yml', "Generate job files for the experiment described in exp.yml for the machine 'vulcan'")
  .example('dimebox submit --machine vulcan HEAD', "Submit job files for the last generated experiment.")
  .help()
  .version()
  .demandCommand(1, 'You need at least one command before moving on')
  .recommendCommands()
  .strict()
  .argv
