'use strict'

const child_process = require('child_process'),
    _               = require('lodash'),
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

  const sha = child_process.execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
  const branch = child_process.execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).toString().trim()
  const st = child_process.execFileSync('git', ['status', '-s', '-b']).toString()
  const diff = child_process.execFileSync('git', ['diff']).toString()
  const remotesRaw = child_process.execFileSync('git', ['remote', '-v']).toString()

  const remotes = _.chain(remotesRaw.split('\n'))
    .filter(line => line.length)
    .map(remote => {
      const url = remote.split('\t')[1]
      return url.replace(/\(.*\)/, "").trim()
    })
    .uniq()
    .value()

  return {
    git: {
      sha: sha,
      branch: branch,
      st: st,
      diff: diff,
      remotes: remotes
    }
  }
}


// Grab a value from svn info output
function parseSvnInfo(keyRegex, lines)
{
  for(const line of lines) {
    const match = line.match('^' + keyRegex + ': (.*)$')
    if(match)
      return match[1]
  }
  return null
}

// Read svn info
function svn() {
  try {
    const info = child_process.execFileSync('svn', ['info']).toString().split(/\n/)

    const revision = parseSvnInfo('Revision', info)
    const root = parseSvnInfo('Working Copy Root Path', info)
    const remote = parseSvnInfo('URL', info)

    // Run commands from the root of the repository
    const opts = { cwd: root }
    const st = child_process.execFileSync('svn', ['status'], opts).toString()
    const diff = child_process.execFileSync('svn', ['diff'], opts).toString()

    return {
      svn: {
        revision: revision,
        st: st,
        diff: diff,
        remote: remote,
      }
    }

  } catch (e) {
    return null
  }
}

// Get MD5 hash of executables in expfile
function executable(exp) {
  const cmds = exp.cmds

  let info = {};

  _.each(cmds, (cmd, key) => {
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

function vcs() {
  return git() || svn()
}

module.exports = function(exp) {
  const g = vcs();
  const exe = executable(exp);

  return _.extend({}, g, exe);
}
