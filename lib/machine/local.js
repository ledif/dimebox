const tmpl = (name, p, wall, epoch, cmd, q, cwd) => `
MPIRUN="mpirun -n ${p}"

${cmd}`

module.exports = {
  template: tmpl,
  submit: '/bin/sh'
}
