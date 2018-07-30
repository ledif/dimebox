"use strict"

// Designed to parse lines that have observations but not in JSON format.
// If your output looks something like:
//
//   foo 0 abc
//   foo 2 xyz
//
// You should invoke this parser like
//
//   $ dimebox parse -p regex-observation-parser HEAD foo var1 var2
//

const _ = require('lodash')
module.exports = {
  onInit: params => {
    // A regex to match a line of interest
    this.lineRegex = new RegExp(params[0])
    // The keys for the values on the line
    this.keys = _.drop(params)
  },
  onNewFile: (file) => {},
  parseLine: line => {
      const matches = line.match(this.lineRegex)
      if (!matches)
        return false

      let values = _.drop(line.split(" "))

      return { kvs: _.zip(this.keys, values), tag: 'default' }
  }

}
