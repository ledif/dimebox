'use strict'

const fs = require('fs'),
      chalk = require('chalk'),
      yaml = require('js-yaml'),
      log = require('loglevel')

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

// Parse a file and return an array of [key, value] entries for the given tag
module.exports = function(file, tag, parser, result, epoch) {
  // Read file
  try {
    var contents = fs.readFileSync(file)
  } catch(e) {
    log.debug(warn, `Failed to read ${file}`)
    log.debug(e.message)
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
    if (parsedLine && (!parsedLine.tag || parsedLine.tag == tag)) {
      kvs.push([parsedLine.key, parsedLine.value])
     }
  })

  return {
    file: file,
    kvs: kvs
  }
}
