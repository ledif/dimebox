const tmpl = (spec) => `
MPIRUN="mpirun -n ${spec.p}"

${spec.cmd}`

module.exports = {
  template: tmpl,
  submit: '/bin/sh'
}
