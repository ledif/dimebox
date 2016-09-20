'use strict'

const fs    = require('fs'),
      log   = require('loglevel'),
      yaml  = require('js-yaml'),
      check = require('check-types'),
      _     = require('underscore')

function checkUnknownFields(exp) {
  const whitelist = ['name', 'desc', 'p', 'cmds', 'optargs', 'weakargs', 'env', 'q', 'workspace', 'trials', 'wall', 'epilogue', 'depth', 'depthvar', 'raw']

  for (const key of _.keys(exp)) {
    if (!_.contains(whitelist, key))
      throw Error("unknown field " + key)
  }
}


function validateExp(exp) {
  checkUnknownFields(exp)

  if (!check.assigned(exp)) throw Error("Empty experiment")
  if (!check.assigned(exp.name)) throw Error("No name field")
  if (!check.assigned(exp.desc)) throw Error("No description")

  // processors
  if (!check.assigned(exp.p)) throw Error("No processor counts")
  if (check.emptyArray(exp.p)) throw Error("Processor counts must be an non-empty array")
  if (!check.array.of.number(exp.p)) throw Error("Processor counts must be an array of numbers")

  // depth
  if (exp.depth) {
    if (check.emptyArray(exp.depth)) throw Error("Depth counts must be an non-empty array")
    if (!check.array.of.number(exp.depth)) throw Error("Depth counts must be an array of numbers")
  }

  // cmds
  if (!check.assigned(exp.cmds)) throw Error("No cmds")
  if (!check.object.of.string(exp.cmds)) throw Error("Commands must be key-value pairs of name -> command")

  // optargs
  if (exp.optargs) {
    if (!check.object.of.array(exp.optargs)) throw Error("Optional args must be key-value pairs of arrays")
  }

  // weakargs
  if (exp.weakargs) {
    if (!check.object(exp.weakargs)) throw Error("Weak args must be key-value pairs")
  }

  // environment vars
  if (exp.env) {
    if (!check.object(exp.env)) throw Error("Environment variables must be key-value pairs")
  }
 
  // queues
  if (exp.q) {
    if (!check.object.of.number(exp.q)) throw Error("Queue must be key-value pairs of queue name and max processor count for that queue (inclusive)")
  }

  // workspace
  if (exp.workspace) {
    if (!check.object(exp.workspace)) throw Error("workspace must be an object")
    if (!check.array.of.string(exp.workspace.links)) throw Error("Workspace must have links field as an array of strings")
  }

  // trials
  if (exp.trials) {
    if (!check.number(exp.trials)) throw Error("Trials must be a number")
  }

  // wall
  if (!check.string(exp.wall)) throw Error("wall must be a string")

  // raw flags
  if (exp.raw) {
    if (!check.object(exp.raw)) throw Error("raw field must be an object")

    if (!exp.raw.headers && !exp.raw.runFlags) throw Error("raw field must have a headers or runFlags subfield")

    // raw headers
    if (exp.raw.headers) {
      if (!check.array.of.string(exp.raw.headers)) throw Error("Raw headers must be an array of strings")
    }

    // runFlags
    if (exp.raw.runFlags) {
      if (!check.array.of.string(exp.raw.runFlags)) throw Error("Raw runFlags must be an array of strings")
    }
  }
}

function loadExpfile(filename) {
  // Try to read contents of file
  try {
    var contents = fs.readFileSync(filename)
    log.debug("Read in expfile ", filename)
  } catch(e) {
    log.error("Error: cannot open file", filename, "for reading")
    log.error(e.message)
    process.exit(1);
  }

  if (contents.toString().length == 0) {
    log.error("Error: file", filename, "is empty")
    process.exit(1);
  }

  // Try to parse as YAML
  try {
    var exp = yaml.safeLoad(contents)
  } catch (e) {
    log.error(`Error: failed to parse ${filename} as a valid YAML file.`)
    log.error(e.message)
    process.exit(1)
  }

  // Provide defaults
  if (!exp.wall) exp.wall = '00:30:00'
  if (!exp.name) exp.name = 'job'
  if (!exp.depth) exp.depth = [1]
  if (!exp.depthvar) exp.depthvar = "OMP_NUM_THREADS"

  // Validate the experiment
  try {
    validateExp(exp)
  } catch (e) {
    log.error("Experiment configuration malformed:", e.message)
    process.exit(1)
  }

  return exp
}

module.exports = {
  loadExpfile: loadExpfile,
  validateExp:  validateExp
}
