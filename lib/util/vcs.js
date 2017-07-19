'use strict'

const child_process = require('child_process'),
    _               = require('lodash')

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
    const info = child_process.execFileSync('svn', ['info'], {stdio: 'pipe'}).toString().split(/\n/)
    if(info.length < 1)
      throw Error("Not an SVN working copy")

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

function vcs() {
  return git() || svn()
}

module.exports = vcs;