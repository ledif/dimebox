'use strict'

const fs = require('fs'),
      epochUtils = require('./util/epochs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      Q = require('q'),
      log = require('loglevel'),
      Table = require('cli-table');

var readFile = Q.nfbind(fs.readFile);

function experimentStatus(epoch) {
    const resultsDir = `${process.cwd()}/experiments/results/${epoch}/`
    const runFile = `${process.cwd()}/experiments/jobs/${epoch}/run.yml`

    let desc = '-'
    let expectedResults = '-'
    // read experiment YAML
    try {
        var exp = yaml.safeLoad(fs.readFileSync(runFile))
        desc = exp.desc
        expectedResults = _.reduce(exp.optargs, (a, b) => { return a * b.length; }, exp.p.length);
        expectedResults *= _.keys(exp.cmds).length
    } catch (e) { }

    let numResults = 0
    let failed = []
    try {
      const results = _.reject(
        fs.readdirSync(resultsDir),
        filename => { return filename.includes('.yml') || filename.includes(".fail") || filename === 'stderr' || filename === 'stdout'; }
      )

      numResults = results.length
      
      // Failed files begin with . and end in .fail
      failed = _.chain(fs.readdirSync(resultsDir))
        .filter(filename => { return filename.includes(".fail"); })
        .map(s => s.substr(1, s.length-6))
        .value()

    } catch (e) {
      log.error(e)
    }

    let numFailed = failed.length

    return {
      epoch: epoch,
      expected: expectedResults,
      files: numResults,
      failed: numFailed,
      failedFiles: failed,
      desc: desc
    }
}

function allSummary() {
  let epochs = fs.readdirSync(`${process.cwd()}/experiments/results/`).sort().reverse()

  // Bail if empty experiment set
  if (epochs.length == 0)
    return;

  let statuses = _.map(epochs, epoch => { return experimentStatus(epoch) });
  let rows = _.map(statuses, stat => {
    return [stat.epoch, stat.expected, stat.files, stat.failed, stat.desc] 
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

  const stat = experimentStatus(epoch)
  log.info(chalk.bold("Description: "), stat.desc)
  log.info(chalk.bold("Epoch:       "), epoch)
  log.info(chalk.bold("Expected:    "), stat.expected)
  log.info(chalk.bold("Files:       "), stat.files == stat.expected ? chalk.green(stat.files) : stat.files)
  log.info(chalk.bold("Failed:      "), stat.failed == 0 ? 0 : chalk.red(stat.failed))

  if (stat.failed > 0) {
    _.each(stat.failedFiles, f => {
      log.info(chalk.bold("Failed file: "), f)
    })
  }

  log.info("")

  // Print experiment file
  if (expfile) {
    log.info(chalk.bold.yellow("Experimental setup: "))
    const runConfig = fs.readFileSync(`${process.cwd()}/experiments/jobs/${epoch}/run.yml`).toString()
    log.info(runConfig)
  }

  // Print random job
  if (sample) {
    let epochDir = `${process.cwd()}/experiments/jobs/${epoch}`
    const jobFiles = 
      _.filter(fs.readdirSync(epochDir),
      filename => { return filename.includes('.job')}
    )

    let randomJob = jobFiles[Math.floor(Math.random()*jobFiles.length)]
    const jobFileContents = fs.readFileSync(`${process.cwd()}/experiments/jobs/${epoch}/${randomJob}`).toString()

    log.info(chalk.bold.yellow("Random job: "), `${process.cwd()}/experiments/jobs/${epoch}/${randomJob}`)
    log.info(jobFileContents)
  }

  // VC information
  if (vc) {
    const vcFilename = `${process.cwd()}/experiments/jobs/${epoch}/vc.yml`
    if (fs.existsSync(vcFilename)) {
      const vcInfo = yaml.safeLoad(fs.readFileSync(vcFilename))

      if (vcInfo.git)  {
        log.info("")
        log.info(chalk.bold.yellow("Version control: git"))
        log.info(chalk.bold("commit: ", vcInfo.git.sha))
        log.info(chalk.bold("remotes: ", vcInfo.git.remotes))
        log.info(chalk.bold(vcInfo.git.st))
        log.info(chalk.bold(vcInfo.git.diff))
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
