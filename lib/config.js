'use strict'

let yaml = require('js-yaml'),
    fs   = require('fs'),
    log   = require('loglevel')

function userFile(name) {
  const userHome = process.env.HOME || '~'
  return `${userHome}/.dimebox/${name || ''}`
}

function loadConfig(type, name) {
  const userDir = userFile(type + "s")

  if (fs.existsSync(userDir + '/' + name + '.js'))
    return require(userDir + '/' + name);

  const inDimeboxDir = __dirname + `/${type}s/` + name + '.js';
  //console.log(inDimeboxDir)

  if (!fs.existsSync(inDimeboxDir)) {
    log.error('Cannot find', type, name, 'in dimebox distribution or', userDir)
    process.exit(1);
  }

  try {
    return require(`./${type}s/` + name);
  } catch (e) {
    log.error(`Cannot load ${type} file in dimebox/lib/${type}s/` + name, e)
    process.exit(1);
  }
}

module.exports = {
  load: loadConfig,
  parser: loadConfig.bind(this, 'parser'),
  machine: loadConfig.bind(this, 'machine'),
  yaml: function(name) {
    const file = userFile() + name + '.yml'

    // Silently fail when loading yaml files
    if(!fs.existsSync(file)) {
      return {}
    }
    try {
      return yaml.safeLoad(fs.readFileSync(file))
    } catch(e) {
      return {}
    }
  }
}
