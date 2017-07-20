"use strict"

exports.command = 'xyz <command>'
exports.desc =" Interface with dimebox.xyz."
exports.builder = function(yargs) {
  return yargs.commandDir('xyz')
}
exports.handler = function(argv) { }
