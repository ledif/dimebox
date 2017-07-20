'use strict'

const log = require('loglevel'),
      path  = require('path'),
      fs  = require('fs')

/**
 * Return the user's authorization token for dimebox.xyz, or abort
 * if it doesn't exists / is unreadable
 *
 * @return The JWT as a string
 */
module.exports = function() {
  const home = process.env.HOME || '~'
  const xyzDir = path.join(home, '.dimebox/xyz')
  const file = path.join(xyzDir, 'auth.jwt')

  if (!fs.existsSync(file)) {
    log.error("Token for interaction with dimebox.xyz does not exist.")
    log.error("First run `dimebox xyz auth`")
    process.exit(1)
  }

  let token = ""

  try {
    token = fs.readFileSync(file).toString()
  } catch (e) {
    log.error(e)
    log.error(`Cannot load ${file} which is needed for communication with xyz.`)
    process.exit(1)
  }

  token = token.replace(/\n/,"")

  return token;
}
