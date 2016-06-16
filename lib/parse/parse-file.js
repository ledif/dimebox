'use strict'

const fs = require('fs'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      log = require('loglevel'),
      _ = require('lodash'),
      stats = require('./stats')

const warn = chalk.red.bold("WARNING:")

// Read in the parameters for a given result, which is stored in the .md directory.
// Return an array of [key, value] pairs.
function paramsForResult(epoch, result) {
  const mdFile = `${process.cwd()}/experiments/results/${epoch}/.md/${result}.yml`

  let yml = {}
  try {
     yml = yaml.safeLoad(fs.readFileSync(mdFile))
  } catch (e) { console.log(e); return {} }

  let params = [
    ["_cmd", yml.cmd],
    ["_p", yml.p],
    ["_depth", yml.depth]
  ]

  for (let x in yml.params) {
    params.push(["_"+x, yml.params[x]])
  }

  return params;
}


// Take a list of key value pairs and either print out warnings
// if multiple keys appear twice, or aggregate them if desired
function aggregate(kvs, file, allowed) {
  // Group the key-values by their key
  const grouped = _.chain(kvs)
    .groupBy(kv => kv[0])
    .mapValues(vals => {
      return _.map(vals, v => v[1])
    })
    .value()

  let summarized = []
  _.mapKeys(grouped, (values, key) => {
    if (values.length == 1) {
      summarized.push([key, values[0]])
      return;
    }

    // If key is repeated and we are not aggregating, print out warning
    // and only take the first value
    if (!allowed) {
      log.warn(warn, `file contains same key '${key}' twice:`)
      log.warn(file)
      summarized.push([key, values[0]])
      return;
    }

    const floatValues = _.map(values, parseFloat)

    // At this point, we should aggregate
    const st = stats(floatValues)

    // Format the numbers in a pretty way
    const pretty_st = _.mapValues(st, val => {
      return val > 999999 || val < 0.0001 ? Number(val).toExponential(6) : Number(val).toPrecision(6)
    })
    summarized.push([key+'_mean', pretty_st.mean])
    summarized.push([key+'_conf', pretty_st.conf])
    summarized.push([key+'_stddev', pretty_st.stddev])
    summarized.push([key+'_min', pretty_st.min])
    summarized.push([key+'_max', pretty_st.max])
    summarized.push([key+'_samples', pretty_st.samples])
  })

  return summarized
}


// Parse a file and return an array of [key, value] entries for the given tag
module.exports = function(opt) {
  const file = opt.file
  const parser = opt.parser
  const epoch = opt.epoch
  const result = opt.result
  const allowed = opt.shouldAggregate

  // Read file
  try {
    var contents = fs.readFileSync(file)
  } catch(e) {
    log.warn(warn, `Failed to read ${file}`)
    log.warn(e.message)
    return {
      file: file,
      kvs: []
    }
  }

  let kvs = paramsForResult(epoch, result)

  // Feed each line to parser
  contents.toString().split('\n').map(line => {
    // Call parser to receive array of [key, value]
    try {
      var parsedLine = parser(line)
    } catch (e) {
      log.warn(warn, `Parser threw while parsing line '${line}' from file ${file}:`)
      log.warn(e.message)
    }

    // If the parser found something useful and it is either the same tag or doesn't have a tag
    if (parsedLine && (!parsedLine.tag || parsedLine.tag == opt.tag)) {
      kvs.push([parsedLine.key, parsedLine.value])
     }
  })

  const summarized = aggregate(kvs, file, allowed)

  return {
    file: file,
    kvs: summarized
  }
}
