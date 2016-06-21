const yaml = require('js-yaml')

const tmpl = (spec) => {
  return yaml.safeDump(spec)
}

module.exports = {
  template: tmpl,
  submit: '/bin/true'
}
