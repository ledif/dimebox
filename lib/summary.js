'use strict'

const fs = require('fs'),
      epochUtils = require('./util/epochs'),
      dirs = require('./util/dirs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      Q = require('q'),
      log = require('loglevel'),
      Table = require('cli-table');

var readFile = Q.nfbind(fs.readFile);

function allSummary() {
  let epochs = fs.readdirSync(dirs.results()).sort().reverse()

  // Bail if empty experiment set
  if (epochs.length == 0)
    return;

  let statuses = _.map(epochs, epoch => { return epochUtils.status(epoch) });
  let rows = _.map(statuses, stat => {
    return [stat.epoch, stat.expected.length, stat.done.length, stat.failed.length, stat.desc] 
  });

  const longestDesc = _.max(statuses, stat => stat.desc.length).desc.length
  const descWidth = Math.min(longestDesc+2, 100)

  let table = new Table({
    head: ['Epoch', '#', 'files', 'fail', 'Description'], colWidths: [17, 7, 7, 7, descWidth],
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
   });

  log.debug(rows)
  Array.prototype.push.apply(table, rows)
  log.info(table.toString());
}

function singleSummary(epoch, sample, vc, expfile) {
  // resolve actual epoch
  epoch = epochUtils.resolve(epoch)

  const stat = epochUtils.status(epoch)
  log.info(chalk.bold("Description: "), stat.desc)
  log.info(chalk.bold("Epoch:       "), epoch)
  log.info(chalk.bold("Expected:    "), stat.expected.length)
  log.info(chalk.bold("Done:        "), stat.done.length == stat.expected.length ? chalk.green(stat.done.length) : stat.done.length)
  log.info(chalk.bold("Failed:      "), stat.failed.length == 0 ? 0 : chalk.red(stat.failed.length))

  _.each(stat.failed, f => {
    log.info(chalk.bold("Failed file: "), f.name)
  })

  log.info("")

  // Print experiment file
  if (expfile) {
    log.info(chalk.bold.yellow("Experimental setup: "))
    const runConfig = fs.readFileSync(dirs.jobs(epoch, 'run.yml')).toString()
    log.info(runConfig)
  }

  // Print random job
  if (sample) {
    let epochDir = dirs.jobs(epoch)
    const jobFiles = 
      _.filter(fs.readdirSync(epochDir),
      filename => { return filename.includes('.job')}
    )

    let randomJob = jobFiles[Math.floor(Math.random()*jobFiles.length)]
    const randomJobfile = dirs.jobs(epoch, randomJob)
    const jobFileContents = fs.readFileSync(randomJobfile).toString()

    log.info(chalk.bold.yellow("Random job: "), randomJobfile)
    log.info(jobFileContents)
  }

  // VC information
  if (vc) {
    const vcFilename = dirs.jobs(epoch, 'vc.yml')
    if (fs.existsSync(vcFilename)) {
      const vcInfo = yaml.safeLoad(fs.readFileSync(vcFilename))

      if (vcInfo.git)  {
        const v = vcInfo.git
        log.info("")
        log.info(chalk.bold.yellow("Version control: git"))
        log.info(chalk.bold("commit: ", v.sha))

        if (vcInfo.git.branch)
          log.info(chalk.bold("branch: ", vcInfo.git.branch))

        log.info(chalk.bold("remotes: ", v.remotes))
        log.info(chalk.bold(v.st))
        log.info(chalk.bold(v.diff))
      }
      else if (vcInfo.svn)  {
        const v = vcInfo.svn
        log.info("")
        log.info(chalk.bold.yellow("Version control: svn"))
        log.info(chalk.bold("revision: ", v.revision))
        log.info(chalk.bold("remote: ", v.remote))
        log.info(chalk.bold(v.st))
        log.info(chalk.bold(v.diff))
      }

      if (vcInfo.exe)  {
        log.info(chalk.bold.yellow("Executable information"))
        for (const exe in vcInfo.exe) {
          log.info(chalk.bold(exe), vcInfo.exe[exe].md5)
        }
      }
    }
  }
}

module.exports = function(epoch, sample, vc, expfile) {
  if (!epoch)
    allSummary()
  else
    singleSummary(epoch, sample, vc, expfile)
}
