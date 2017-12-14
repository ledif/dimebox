'use strict'

const chalk = require('chalk')

module.exports = {
  colorForState: function(state) {
    switch (state) {
      case "failed": return chalk.red
      case "done": return chalk.green
      case "started": return chalk.yellow
      case "waiting": return chalk.gray
      default:
        log.error("Unknown state", state)
        process.exit(1)
    }
  },

  statusCharacter: function(state) {
    switch (state) {
      case "failed": return chalk.red('x')
      case "done": return chalk.green('+')
      case "started": return chalk.yellow('o')
      case "waiting": return chalk.gray('-')
      default:
        log.error("Unknown state", state)
        process.exit(1)
    }
  }
}

