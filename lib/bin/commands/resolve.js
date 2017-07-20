"use strict"

const resolve = require('../../resolve'),
      log     = require('loglevel'),
      guard   = require('../../util/validate')

module.exports = {
  command: 'resolve <epoch>',
  desc: 'Resolve a symbolic epoch to concrete epoch.',

  builder: {},
  handler: (argv) => {
    guard()
    log.setLevel(argv.v ? 'debug' : 'info')

    resolve(argv.epoch)
  }
}
