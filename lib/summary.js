'use strict'

const fs = require('fs'),
      _ = require('underscore'),
      chalk = require('chalk'),
      util = require('util'),
      yaml = require('js-yaml'),
      Q = require('q'),
      log = require('loglevel'),
      Table = require('cli-table');

var readFile = Q.nfbind(fs.readFile);

function isFailedResult(str, failureStrings) {
  return /not found/.test(str) || /Error/.test(str)  || /No such file or directory/.test(str) || /exit codes/.test(str)
}

function experimentStatus(epoch) {
    const failureStrings = ''
    const resultsDir = `${process.cwd()}/experiments/results/${epoch}/`
    const runFile = `${process.cwd()}/experiments/jobs/${epoch}/run.yml`

    let desc = '-'
    let expectedResults = '-'
    // read experiment YAML
    try {
        var exp = yaml.safeLoad(fs.readFileSync(runFile))
        desc = exp.desc
        expectedResults = _.reduce(exp.optargs, (a, b) => { return a * b.length; }, exp.p.length);
        expectedResults *= exp.cmds.length
    } catch (e) { }

    let numResults = 0
    let numFailed = 0
    try {
      const results = _.reject(
        fs.readdirSync(resultsDir),
        filename => { return filename.includes('.yml') || filename === 'stderr' || filename === 'stdout'; }
      )

      numResults = results.length
      numFailed = _.reduce(results, (acc, filename) => {
        const resultsContent = fs.readFileSync(`${resultsDir}/${filename}`)
        return acc + isFailedResult(resultsContent, failureStrings)
      }, 0);

    } catch (e) {
      log.error(e)
    }

    return {
      epoch: epoch,
      expected: expectedResults,
      files: numResults,
      failed: numFailed,
      desc: desc
    }
}

function allSummary() {

  let epochs = fs.readdirSync(`${process.cwd()}/experiments/results/`).sort().reverse()

  let table = new Table({
    head: ['Epoch', '#', 'files', 'fail', 'Description'], colWidths: [17, 7, 7, 7, 100],
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
   });


  let statuses = _.map(epochs, epoch => { return experimentStatus(epoch) });
  let rows = _.map(statuses, stat => {
    return [stat.epoch, stat.expected, stat.files, stat.failed, stat.desc] 
  });

  log.debug(rows)
  Array.prototype.push.apply(table, rows)
  log.info(table.toString());
}

function singleSummary(epoch, sample, vc, conf) {
  if (epoch == 'HEAD') {
    let epochs = fs.readdirSync(`${process.cwd()}/experiments/jobs/`).sort().reverse()
    epoch = epochs[0]
  }

  const stat = experimentStatus(epoch)
  log.info(chalk.bold("Description: "), stat.desc)
  log.info(chalk.bold("Epoch:       "), epoch)
  log.info(chalk.bold("Expected:    "), stat.expected)
  log.info(chalk.bold("Files:       "), stat.files == stat.expected ? chalk.green(stat.files) : stat.files)
  log.info(chalk.bold("Failed:      "), stat.failed == 0 ? 0 : chalk.red(stat.failed))
  log.info("")

  // Print experiment file
  if (conf) {
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

    let randomJob = jobFiles[0]
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
    }
  }
}

module.exports = function(epoch, sample, vc, conf) {
  if (!epoch)
    allSummary()
  else
    singleSummary(epoch, sample, vc, conf)
}
