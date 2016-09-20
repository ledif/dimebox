const tmpl = (spec) => `
MPIRUN="mpirun -n ${spec.p} ${spec.runFlags}"

${spec.cmd}`

module.exports = {
  template: tmpl,
  submit: '/bin/sh'
}
