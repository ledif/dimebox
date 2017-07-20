"use strict"

const kill     = require('../../kill'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'kill <epoch>',
  desc: 'Kill all jobs for an epoch',

  builder: (yargs) => {
    return yargs
      .option('machine', {
        alias: 'm',
        default: defaults.nested('kill', 'machine'),
        describe: "The machine where the experiments are run."
      })
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    kill({
      machine: argv.machine,
      epoch: argv.epoch,
    });
  }
}
