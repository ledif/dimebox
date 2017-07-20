'use strict'

const ping  = require('../../../xyz/ping'),
      guard = require('../../../util/validate')

module.exports = {
  command: 'ping',
  desc: 'Test current configuration against remote',

  builder: {},
  handler: (argv) => {
    guard()
    ping()
  }
}
