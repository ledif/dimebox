const tmpl = (spec) => {
  const headers = spec.rawHeaders.map(header => `#SBATCH ${header}`).join('\n')
  return `#!/bin/bash -l
#SBATCH -p ${spec.q}
#SBATCH -N ${Math.ceil(spec.p / 24)}
#SBATCH -t ${spec.wall}
#SBATCH -D ${spec.cwd}
#SBATCH -e experiments/results/${spec.epoch}/stderr/${spec.name}.err
#SBATCH -o experiments/results/${spec.epoch}/stdout/${spec.name}.out
${headers}

MPIRUN="srun -n ${spec.p} --ntasks-per-node=24 ${spec.runFlags.join(' ')}"

${spec.cmd}
`
}

module.exports = {
  template: tmpl,
  submit: 'sbatch',
  submitArgs: {
    depend: (prev) => `-d after:${prev}`
  }
}
