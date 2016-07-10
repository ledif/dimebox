const tmpl = (spec) => `#!/bin/bash -l
#SBATCH -p ${spec.q}
#SBATCH -N ${Math.ceil(spec.p / 12)}
#SBATCH -t ${spec.wall}
#SBATCH -D ${spec.cwd}
#SBATCH -e experiments/results/${spec.epoch}/stderr/${spec.name}.err
#SBATCH -o experiments/results/${spec.epoch}/stdout/${spec.name}.out

MPIRUN="srun -n ${spec.p} --ntasks-per-node=12"

${spec.cmd}
`

module.exports = {
  template: tmpl,
  submit: 'sbatch',
  submitArgs: {
    depend: (prev) => `-d after:${prev}`
  }
}
