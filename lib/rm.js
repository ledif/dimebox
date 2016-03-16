'use strict'

const fs = require('node-fs-extra'),
      log = require('loglevel'),
      epochUtils = require('./util/epochs.js')


module.exports = function(epoch) {
  // resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  if (epoch.length < 1) {
    log.error("Epoch information failed to parse");
    process.exit(1)
  }
  
  const jobsDir = `${process.cwd()}/experiments/jobs/${epoch}`
  const resultsDir = `${process.cwd()}/experiments/results/${epoch}`

  if (jobsDir.length < 1 || resultsDir.length < 1) {
    log.error("Bailing: couldn't resolve jobs/ or results/ dir.");
    process.exit(1)
  }

  fs.removeSync(jobsDir);
  fs.removeSync(resultsDir);
 
  log.info(`Deleted epoch ${epoch}.`)
}

