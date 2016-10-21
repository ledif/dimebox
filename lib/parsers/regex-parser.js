"use strict"
const _ = require('lodash')

module.exports = (line, params) => {
  const regexes = _.map(params, str => new RegExp(str))
  for(let regex of regexes) {
    const matches = line.match(regex)
    if(!matches)
      continue

    return { key: _.snakeCase(matches[1]), value: matches[2], tag: 'default' }
  }
  return false
}
