"use strict"

module.exports = line => {
  if (!line.match(/^dbx.kv/))
    return false

  const split = line.replace('dbx.kv', '').split(':')
  return {
    tag: 'default',
    key: split[0],
    value: split[1]
  }
}
