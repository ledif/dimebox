'use strict'

const fs = require('fs'),
      _  = require('underscore')

module.exports = function(epoch) {
  if (!epoch || epoch == 'HEAD') {
    let epochs = fs.readdirSync(`${process.cwd()}/experiments/jobs/`).sort().reverse()
    epoch = epochs[0]
  }

  let epochDir = `${process.cwd()}/experiments/jobs/${epoch}`
  const jobFiles = 
    _.filter(fs.readdirSync(epochDir),
    filename => { return filename.includes('.job')}
  )

  let randomJob = jobFiles[0]
  const jobFileContents = fs.readFileSync(`${process.cwd()}/experiments/jobs/${epoch}/${randomJob}`)

  console.log(jobFileContents.toString());
}

