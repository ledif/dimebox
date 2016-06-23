'use strict'
 
 const dirs = require('./dirs'),
       fs =   require('fs'),
       yaml = require('js-yaml')

module.exports = {
  // Read in the parameters for a given result, which is stored in the .md directory.
  // Return an array of [key, value] pairs.
  params: function(epoch, result, prefix) {
    prefix = prefix || ''
    const mdFile = dirs.results(epoch, `.md/${result}.yml`)

    let yml = {}
    try {
       yml = yaml.safeLoad(fs.readFileSync(mdFile))
    } catch (e) { console.log(e); return {} }

    let params = [
      [`${prefix}cmd`, yml.cmd],
      [`${prefix}p`, yml.p],
      [`${prefix}depth`, yml.depth]
    ]

    for (let x in yml.params) {
      params.push([`${prefix}${x}`, yml.params[x]])
    }

    return params;
  }
}
