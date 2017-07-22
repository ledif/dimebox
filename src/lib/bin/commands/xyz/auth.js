'use strict'

const auth  = require('../../../xyz/auth'),
      guard = require('../../../util/validate')

module.exports = {
  command: 'auth',
  desc: 'Set up interface for dimebox.xyz remote',

  builder: {},
  handler: (argv) => {
    guard()

    auth()
  }
}
