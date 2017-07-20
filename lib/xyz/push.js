'use strict'

const fs = require('node-fs-extra'),
      epochUtils = require('../util/epochs'),
      dirs = require('../util/dirs'),
      _ = require('lodash'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      Q = require('q'),
      log = require('loglevel'),
      request = require('request'),
      getJWT = require('./jwt')

/**
 * Load a YAML file and return its contents as an object.
 * If the file doesn't exist, return an empty string
 *
 * @param {String} filename Name of file to load
 */
function loadYAML(filename) {
  let o = {}
  try {
    o = yaml.safeLoad(fs.readFileSync(filename))
  } catch (e) { }

  return o;
}

/**
 * Load a JSON file and return its contents as an object.
 * If the file doesn't exist, return an empty string
 *
 * @param {String} filename Name of file to load
 */
function loadJSON(filename) {
  let o = ""
  try {
    o = fs.readJsonSync(filename)
  } catch (e) { }

  return o;
}

/**
 * Load an unstructured text file and return its contents as a string.
 * If the file doesn't exist, return an empty string
 *
 * @param {String} filename Name of file to load
 */
function loadRaw(filename) {
  let str = ""
  try {
    str = fs.readFileSync(filename).toString()
  } catch (e) { }

  return str;
}

/**
 * Gather information about a single result from an experiment
 *
 * @param {String} res A result of an experiment
 * @param {String} epoch A concrete epoch for the experiment
 */
function result(res, epoch) {
  const resultFile = dirs.results(epoch, '.started', res.name)
  const doneFile = dirs.results(epoch, '.done', res.name)
  const failedFile = dirs.results(epoch, '.fail', res.name)
  const mdFile = dirs.results(epoch, '.md', `${res.name}.yml`)

  const md = loadYAML(mdFile)

  // hasn't started
  let stat = 0;
  // done
  if (fs.existsSync(doneFile))
    stat = 1
  // failed
  else if (fs.existsSync(failedFile))
    stat = 2
  // still running
  else if (fs.existsSync(resultFile))
    stat = 3

  const startTime = res.modified
  const finishTime = res.modified

  let job = loadRaw(md.job)
  let raw = loadRaw(dirs.results(epoch, res.name))

  return {
    name: res.name,
    status: stat,
    startTime: startTime,
    finishTime: finishTime,
    raw: raw,
    job: job
  }
}

/**
 * Determine the status of an experiment based on the status of all of its
 * results.
 *
 * @param {Array} results List of results from a single experiment
 */
function experimentStatus(results) {
  const statuses = _.map(results, r => Number(r.status))

  // If everything is successful, return success
  if (_.every(statuses, s => s == 1))
    return 1

  // If one failed, it's failed
  if (_.some(statuses, s => s == 2))
    return 2

  // If one is running, it's mixed
  if (_.some(statuses, s => s == 3))
    return 3

  // Otherwise, nothing started
  return 0
}

/**
 * Compute information for a single experiment at a given epoch.
 *
 * @param {String} epoch A concrete epoch
 */
function experiment(epoch) {
  const stat = epochUtils.status(epoch)

  const vc = loadYAML(dirs.jobs(epoch, 'vc.yml'))
  const machine = loadYAML(dirs.jobs(epoch, 'machine.yml')) || {}
  const expfile = loadRaw(dirs.jobs(epoch, 'run.yml'))

  const results = _.map(stat.expected, res => { return result(res, epoch) })

  const structured = loadJSON(dirs.results(epoch, ".parsed", "results.json")) || {}

  const overallStatus = experimentStatus(results)

  const generated = fs.statSync(dirs.jobs(epoch)).mtime

  return {
    epoch: epoch,
    desc: stat.desc,
    generated: generated,
    expfile: expfile,
    vc: vc,
    machine: machine,
    status: overallStatus,
    observations: structured,
    results: results
  }
}

/**
 * Return version control information for an experiment set.
 * @param {Array} experiments  List of experiments
 */
function vcInfo(experiments) {
  const first = experiments[0]

  if (first.vc.git) {
    return {
      vcs: "git",
      remote: first.vc.git.remotes[0]
    }
  } else {
    return {
      vcs: "-",
      remote: "-"
    }
  }
}

/**
 * Gather the machine information for the first experiment.
 *
 * @param {Array} experiments List of experiments
 */
function machineInfo(experiments) {
  const first = experiments[0]

  return first.machine
}

/**
 * Gather information about an entire experiment set.
 * @return All experiments
 */
function gather() {
  const epochs = fs.readdirSync(dirs.jobs())

  // Bail if empty experiment set
  if (epochs.length == 0) {
    log.error("This experiment set is empty.")
    process.exit(1)
  }

  const metadata = loadYAML("experiments/metadata/expset.yml")

  const experiments =  _.map(epochs, experiment);

  const vc = vcInfo(experiments)

  const machine = machineInfo(experiments)

  return {
    id: metadata.uuid,
    desc: metadata.description,
    vc: vc,
    machine: machine,
    experiments: experiments,
  }
}

/**
 * Push an entire experiment set to the dimebox.xyz endpoint. If the experiment
 * set already exists on the remote, this will result in an error.
 *
 * @param {String} epoch A symbolic epoch to push
 */
function pushExpset() {
  const payload = gather()
  const jwt = getJWT()

  const opts = {
    method: 'POST',
    url: 'http://dimebox.xyz/api/v1/expset',
    headers: {
      authorization: `Bearer ${jwt}`
    },
    json: payload
  }

  console.log("Sending payload of size", JSON.stringify(payload).length)

  request(opts, (error, response, body) => {
    if (error) {
      log.error("Error connecting to endpoint", opts.url)
      process.exit(1)
    }

   if (response.statusCode == 401) {
      log.error("Not authorized.")
      process.exit(1)
   }

   if (response.statusCode != 200) {
      log.error("Received unexpected status code", response.statusCode)
      process.exit(1)
   }


   console.log("Received ", body)
  })
}

function gatherExperiment(epoch) {
  const exp = experiment(epoch)
  const metadata = loadYAML("experiments/metadata/expset.yml")

  return {
    expset: metadata.uuid,
    experiments: [exp]
  }
}

/**
 * Push a single experiment to the dimebox.xyz endpoint.
 *
 * @param {String} epoch A symbolic epoch to push
 */
function pushExp(epoch) {
  epoch = epochUtils.resolve(epoch)

  const gathered = gatherExperiment(epoch)

  const payload = gathered
  const expset = gathered.expset

  const jwt = getJWT()

  const opts = {
    method: 'POST',
    url: `http://dimebox.xyz/api/v1/expset/${expset}`,
    headers: {
      authorization: `Bearer ${jwt}`
    },
    json: payload
  }

  console.log("Sending payload of size", JSON.stringify(payload).length)

  request(opts, (error, response, body) => {
    if (error) {
      log.error("Error connecting to endpoint", opts.url)
      process.exit(1)
    }

   if (response.statusCode == 401) {
      log.error("Not authorized.")
      process.exit(1)
   }

   if (response.statusCode != 200) {
      log.error("Received unexpected status code", response.statusCode)
      process.exit(1)
   }


   console.log("Received ", body)
  })
}

/**
 * Push an experiment set or a single experiment to the dimebox.xyz endpoint.
 *
 * @param {String} epoch Symbolic epoch to push. If null, will try to push the
 * entire experiment set
 */
module.exports = function(epoch) {
  if (!fs.existsSync("experiments/metadata/expset.yml")) {
    log.error("Error: no metadata file present.")
    log.error("First perform `dimebox set-metadata`")
    process.exit(1)
  }

  if (!epoch)
    pushExpset()
  else
    pushExp(epoch)
}