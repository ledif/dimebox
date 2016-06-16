'use strict'

const fs = require('node-fs-extra'),
      log = require('loglevel'),
      epochUtils = require('./util/epochs')

module.exports = function(epoch) {
  // Resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  if (epoch.length < 1) {
    log.error("Epoch information failed to parse");
    process.exit(1)
  }
  
  const cwd = process.cwd();
  const jobsDir = `${cwd}/experiments/jobs/${epoch}`
  const resultsDir = `${cwd}/experiments/results/${epoch}`

  if (jobsDir.length < 1 || resultsDir.length < 1) {
    log.error("Bailing: couldn't resolve jobs/ or results/ dir.");
    process.exit(1)
  }

  fs.removeSync(jobsDir);
  fs.removeSync(resultsDir);

  // Try to delete workspaces for epoch
  try {
    const workspacesDir = `${cwd}/experiments/workspaces/${epoch}`
    fs.removeSync(workspacesDir);
  } catch(e) {
    log.debug("No workspace directories found.");
  }

 
  log.info(`Deleted epoch ${epoch}.`)
}

