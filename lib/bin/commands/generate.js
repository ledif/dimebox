"use strict"

const generate = require('../../generate'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'generate <experiment>',
  desc: "Generate job files",

  builder: (yargs) => {
    return yargs
      .option('machine', {
        alias: 'm',
        default: 'rain',
        describe: "The machine where the experiments will be run."
      })
    .boolean('vc')
    .describe('vc', "Grab version control information and store with jobs.")
    .default('vc', defaults.nested('generate', 'vc'))
    .boolean('v')
  },

  handler: (argv) => {
    guard()

    log.setLevel(argv.v ? 'debug' : 'info')
    generate(argv.machine, argv.experiment, argv.vc)
  }
}
