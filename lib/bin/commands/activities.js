"use strict"

const activities    = require('../../activities'),
      log      = require('loglevel'),
      defaults = require('../defaults'),
      guard    = require('../../util/validate')

module.exports = {
  command: 'activities [options] <epoch>',
  desc: 'List the activities for a given epoch.',

  builder: (yargs) => {
    return yargs
      .option('interval', { default: defaults.nested('activities', 'interval'), describe: "Interval in ms to watch for changes"})
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    activities(argv.epoch, argv.interval)
  }
}
