"use strict"

const setMetadata = require('../../set-metadata'),
      log         = require('loglevel'),
      defaults    = require('../defaults'),
      guard       = require('../../util/validate')

module.exports = {
  command: 'set-metadata',
  desc: 'Set the metadata for this experiment set.',

  builder: (yargs) => {
    return yargs
  },

  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    setMetadata()
  }
}
