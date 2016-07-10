"use strict"

module.exports = line => {
  if (!line.match(/^dbx.kv/))
    return false

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

  return {
    tag: 'default',
    key: split[0].trim(),
    value: split[1].trim()
  }
}
