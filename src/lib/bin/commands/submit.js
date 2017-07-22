"use strict"

const submit   = require('../../submit'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'submit <epoch>',
  desc: 'Submit all jobs for an epoch',

  builder: (yargs) => {
    return yargs
      .option('machine', {
        alias: 'm',
        default: defaults.nested('submit', 'machine'),
        describe: "The machine where the experiments will be run."
      })
    .boolean('dry-run')
    .describe('dry-run', "Only simulate submission of jobs.")
    .boolean('force')
    .describe('force', "Submit jobs for epoch even if already launched before.")
    .boolean('stagger')
    .describe('stagger', "Set up a chain of dependent jobs so that jobs will only be scheduled k at a time.")
    .default('stagger', defaults.nested('submit', 'stagger'))
    .number('batch')
    .describe('batch', "Size of batch for staggered job submission.")
    .implies('batch', 'stagger')
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    const batch = argv.batch || defaults.nested('submit', 'batch')
    submit({
      machine: argv.machine,
      epoch: argv.epoch,
      dryRun: argv['dry-run'],
      stagger: argv.stagger,
      batch: batch,
      force: argv.force
    });
  }
}
