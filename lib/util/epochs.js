"use strict"

const fs =  require('fs'),
      log = require('loglevel')

module.exports = {
  resolve: function(epoch) {
    // find the most recent epoch
    if (epoch == 'HEAD') {
      let epochs = fs.readdirSync(`${process.cwd()}/experiments/jobs/`).sort().reverse()
      if (epochs.length == 0) {
        log.error("Error: HEAD specified but experiment set is empty.")
        process.exit(1)
      }

      log.debug("Resolved epoch to ", epochs[0])
      return epochs[0]
    }

    // Make sure it's actually an epoch now
    if (epoch[0] != '2') {
      log.error(`Error: ${epoch} is not a valid name for an epoch.`)
      process.exit(1)
    }

    // specifc epoch requested, check if it exists and return
    if (!fs.existsSync(`${process.cwd()}/experiments/jobs/${epoch}`)) {
      log.error(`Error: epoch ${epoch} does not exist.`)
      process.exit(1)
    }

    return epoch
  }
}
