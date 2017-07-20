"use strict"

const rm    = require('../../rm'),
      log   = require('loglevel'),
      guard = require('../../util/validate')

module.exports = {
  command: 'rm <epoch>',
  desc: 'Remove the jobs and results for a given epoch.',

  builder: {},
  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    rm(argv.epoch)
  }
}
