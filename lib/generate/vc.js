'use strict'

const child_process = require('child_process'),
    _               = require('underscore'),
    crypto          = require('crypto'),
    fs              = require('fs'),
    chalk           = require('chalk'),
    log             = require('loglevel')

const warn = chalk.red.bold("WARNING:")

// Read git info
function git() {
  // Test if it's a git repo
  try {
    child_process.execFileSync('git', ['rev-parse', 'HEAD'], {stdio: 'ignore'})
  } catch (e) {
    return null
  }

  const sha = child_process.execFileSync('git', ['rev-parse', 'HEAD']).toString()
  const st = child_process.execFileSync('git', ['status', '-s', '-b']).toString()
  const diff = child_process.execFileSync('git', ['diff']).toString()
  const remotes = child_process.execFileSync('git', ['remote', '-v']).toString()

  return {
    git: {
      sha: sha,
      st: st,
      diff: diff,
      remotes: remotes
    }
  }
}

// Get MD5 hash of executables in expfile
function executable(exp) {
  const cmds = exp.cmds

  let info = {};

  _.mapObject(cmds, (cmd, key) => {
    const exeFilename = cmd.split(" ")[0];

    try {
      const exe = fs.readFileSync(exeFilename)
      const md5 = crypto.createHash('md5').update(exe).digest('hex')

      info[exeFilename] = {md5: md5}

    // Can't read exe file
    } catch (e) {
      log.warn(warn, `can't open executable ${exeFilename} for reading.`)
    }
  })

  return {exe: info};
}

module.exports = function(exp) {
  const g = git();
  const exe = executable(exp);

  return _.extend({}, g, exe);
}
