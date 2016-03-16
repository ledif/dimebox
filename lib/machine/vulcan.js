const tmpl = (name, p, wall, epoch, cmd, q, cwd) => `#!/bin/bash
#MSUB -l nodes=${Math.ceil(p / 16)}
#MSUB -l walltime=${wall}
#MSUB -q ${q}
#MSUB -A tamu
#MSUB -d ${cwd}
#MSUB -e experiments/results/${epoch}/stderr/${name}.%j.err
#MSUB -o experiments/results/${epoch}/stdout/${name}.%j.out

MPIRUN="srun -n ${p} --ntasks-per-node=16"

${cmd}
`

module.exports = {
  template: tmpl,
  submit: 'msub',
  submitArgs: {
    depend: (prev) => `-l depend=${prev}`
  }
}
