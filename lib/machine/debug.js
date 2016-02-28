const yaml = require('js-yaml')

const tmpl = (name, p, wall, epoch, cmd, q, cwd) => {
  return yaml.safeDump({
    name, p, wall, epoch, cmd, q, cwd
  })
}

module.exports = {
  template: tmpl,
  submit: '/bin/true'
}
