'use strict'

const _ = require('lodash')

/** Convert a data frame to an array of objects */
function toObjects(df) {
  return _.map(df.rows, row => _.zipObject(df.header, row))
}

/** Convert an array of objects to a data frame */
function fromObjects(objects, header) {
  return _.map(objects, o => {
    return _.map(header, col => o[col])
  })
}

/**
 * Check if the columns specified exist in the header.
 * Coerce column name to have a leading underscore, if possible.
 *
 * @param {Array} cols - array of column names
 * @param {Array} header - header of data frame
 */
function validate(cols, header) {
  return _.map(cols, col => {
    // Return the column if it exists in the header
    if (_.findIndex(header, h => h == col) != -1) {
      return col
    // Attempt to add underscore if it doesn't exist
    } else {
      const with_underscore = '_' + col 
      if (_.findIndex(header, h => h == with_underscore) != -1)
        return with_underscore
      else
        throw Error(`Column ${col} does not appear in results`)
    }
  })
}

/**
 * Select only specific columns from a data frame
 *
 * @param {Object} df - Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} colString - Comma seperated string of column names
 */
function select(df, colString) {
  if (!colString)
    throw Error("No columns selected")

  // Get cols as an array
  const splitCols = colString.split(/\s*,\s*/)

  // Make sure all columns are valid
  const cols = validate(splitCols, df.header)

  // Indices of the columns in the header
  const colIndices = _.map(cols, col => _.findIndex(df.header, x => col == x))

  // Extract just those indices
  const header = _.map(colIndices, i => df.header[i])
  const rows = _.map(df.rows, row => {
    return _.map(colIndices, colIdx => row[colIdx])
  })

  return {header, rows}
}

/**
 * Order rows by values in specified columns
 *
 * @param {String[]} header - the header from the data frame with column names
 * @param {Object[]} objects - rows in the data frame as objects
 * @param {String} colString - Comma seperated string of column names
 */
function order(header, objects, colString) {
  if (!colString)
    throw Error("No columns for ordering")

  // Get cols as an array
  const cols = colString.split(/\s*,\s*/)

  // Determine column order and get rid of ~
  const ordering = cols.map(col => { return col.match(/^~/) ? 'desc' : 'asc' })
  let sortColumns = cols.map(col => { return col.replace(/^~/,'') })

  // Make sure all columns are valid and coerce to underscore
  sortColumns = validate(sortColumns, header)

  // Rearrange the rows
  return _.orderBy(objects, sortColumns, ordering)
}

/**
 * Filter rows according to an expression, in string form
 *
 * @param {String[]} header - the header from the data frame with column names
 * @param {Object[]} objects - rows in the data frame as objects
 * @param {String} rawExprStr - An expression to filter rows by. Any identifiers
 * that do not correspond a column (with or without the underscore) are expected
 * to be properties of Math or Number.
 */
function filter(header, objects, rawExprStr) {
  if(!rawExprStr)
    throw Error("No filter expression")

  // Convert the expression into something JS can eval when passed
  // a row as an object. Anything else is looked for in Math + Number
  const expr = rawExprStr.replace(/[A-Z_][A-Z0-9_]*/gi, (m, off, str) => {
    if(header.indexOf(m) > -1)
      return `row["${m}"]`
    if(header.indexOf("_"+m) > -1)
      return `row["_${m}"]`
    if(m in Math)
      return `Math.${m}`
    if(m in Number)
      return `Number.${m}`
    throw Error(`Unknown indentifier "${m}" in expression "${str}"`)
  })

  // Given this is a user string, it may contain syntax errors
  try {
    const pred = new Function("row", "return " + expr)
    return objects.filter(pred)
  }
  catch(e) {
    throw Error(`Unable to use filter string "${rawExprStr}"` )
  }
}

/**
 * Apply transformations to a data frame, similar to dplyr
 * @param {Object} df - Data frame with a header (array of strings) and rows (array of arrays)
 * @param {String} opt.filter - Expression string to filter rows by
 * @param {String} opt.sortBy - Column names to sort the rows by
 * @param {String} opt.sel - Column names to select out
 * @return {Object} transformed data frame
 */
module.exports = function(df, opt) {
  let filterExpr = opt.filter
  let sortBy = opt.order
  let sel = opt.select

  // If filtering or sortBy, we need to convert the data frame into objects
  if(filterExpr || sortBy) {

    // Convert the data frame to an array of objects
    let objects = toObjects(df)
    const header = df.header

    if(filterExpr)
      objects = filter(header, objects, filterExpr)

    if (sortBy)
      objects = order(header, objects, sortBy)

    df = { rows: fromObjects(objects, header), header }
  }

  if (sel)
    df = select(df, sel)

  return df
}
