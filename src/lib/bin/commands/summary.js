"use strict"

const summary  = require('../../summary'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'summary [epoch]',
  desc: 'Summary of experiment',

  builder: (yargs) => {
    return yargs
      .option('sample', { default: defaults.nested('summary', 'sample'), describe: "Print a sample job file."})
      .option('vc', { default: defaults.nested('summary', 'vc'), describe: "Print version control information."})
      .option('expfile', { default: defaults.nested('summary', 'expfile'), describe: "Print experiment config YAML file."})
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')
    summary(argv.epoch, argv.sample, argv.vc, argv.expfile)
  }
}
