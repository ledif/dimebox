const tmpl = (spec) => `#!/bin/bash
#MSUB -l nodes=${Math.ceil(spec.p / 16)}
#MSUB -l walltime=${spec.wall}
#MSUB -q ${spec.q}
#MSUB -A tamu
#MSUB -d ${spec.cwd}
#MSUB -e experiments/results/${spec.epoch}/stderr/${spec.name}.%j.err
#MSUB -o experiments/results/${spec.epoch}/stdout/${spec.name}.%j.out

MPIRUN="srun -n ${spec.p} --ntasks-per-node=16"

${spec.cmd}
`

module.exports = {
  template: tmpl,
  submit: 'msub',
  submitArgs: {
    depend: (prev) => `-l depend=${prev}`
  },
  kill: 'scancel'
}
