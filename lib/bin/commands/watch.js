"use strict"

const watch    = require('../../watch'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'watch [options] <epoch>',
  desc: 'Monitor the status of results for a given epoch.',

  builder: (yargs) => {
    return yargs
      .option('interval', { default: defaults.nested('watch', 'interval'), describe: "Interval in ms to watch for changes"})
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    watch(argv.epoch, argv.interval)
  }
}
