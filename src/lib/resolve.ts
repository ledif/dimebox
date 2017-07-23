const log = require('loglevel'),
      epochUtils = require('./util/epochs')

export default function(epoch: string) {
  const resolved = epochUtils.resolve(epoch)

  log.info(resolved)
}