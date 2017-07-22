'use strict'

/**
 * Convert the expression into something JS can eval when passed an argument
 * with keys corresponding to variableNames. Anything else is looked for in
 * Math and the Number.
 *
 * @param {String} rawExprStr - The raw string.
 * @param {String[]} variableNames - The keys of the argument object.
 * @param {Object} opts - an options hash containing
 * @property {boolean} underscore - whether to check for an identifier with
 *   a preceeding underscore if not found as is
 */
module.exports = (rawExprStr, variableNames, opts) => {
  const tryUnderscore = opts && opts.underscore
  const expr = rawExprStr.replace(/[A-Z_]\w*/gi, (m, off, str) => {
    if(variableNames.indexOf(m) > -1)
      return `args["${m}"]`
    // if(tryUnderscore && variableNames.indexOf("_"+m) > -1)
    if(variableNames.indexOf("_"+m) > -1)
      return `args["_${m}"]`
    if(m in Math)
      return `Math.${m}`
    if(m in Number)
      return `Number.${m}`
    throw Error(`Unknown indentifier "${m}" in expression "${str}"`)
  })

  // Given this is a user string, it may contain syntax errors
  return new Function("args", "return " + expr)
}
