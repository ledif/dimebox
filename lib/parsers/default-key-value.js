"use strict"

const _ = require('lodash')

function parse_kv(line) {
  // If this line has a tag
  if (line.match(/^dbx.kv\./)) {
    const tag_split = line.replace('dbx.kv.', '').split(' ')
    const tag = tag_split[0].trim()
    const kv_split = line.replace(`dbx.kv.${tag}`, '').split(':')
    return {
      tag: tag,
      key: kv_split[0].trim(),
      value: kv_split[1].trim()
    }
  }

  // If this line doesn't have a tag
  const split = line.replace('dbx.kv', '').split(':')
  const key = split[0].trim()
  const value = split[1].trim()

  if (!key)
    throw Error("Key needs to have length > 0.")

  return {
    tag: 'default',
    key: key,
    value: value
  }
}

function parse_obs(line) {
  const str = line.replace('dbx.obs', '')
  const j = JSON.parse(str)
 
  const kvs = _.toPairs(j)

  return {
    tag: 'default',
    kvs: kvs
  }
}

module.exports = line => {
  if (!line.match(/^dbx\./))
    return false

  if (line.match(/^dbx\.kv/))
    return parse_kv(line)
  else if (line.match(/^dbx\.obs/))
    return parse_obs(line)
  else
    throw Error("Unknown dbx type")
}
