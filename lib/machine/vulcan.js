const tmpl = (name, p, wall, epoch, cmd, q, cwd) => `
#!/bin/bash
#MSUB -l nodes=${Math.ceil(p / 16)}
#MSUB -l walltime=${wall}
#MSUB -q ${q}
#MSUB -A tamu
#MSUB -d ${cwd}
#MSUB -j output

MPIRUN="srun -n ${p} --ntasks-per-node=16"

${cmd}
`

module.exports = {
  template: tmpl,
  submit: 'msub'
}
