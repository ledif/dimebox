"use strict"
const _ = require('lodash')
module.exports = {
  onInit : params => {
    this.regexes = _.map(params, str => new RegExp(str))
  },
  onNewFile : (file) => {},
  parseLine : line => {
    for(let regex of this.regexes) {
      const matches = line.match(regex)
        if(!matches)
          continue
        return { key: _.snakeCase(matches[1]), value: matches[2], tag: 'default' }
    }
    return false
  }

}
