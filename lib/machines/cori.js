const tmpl = (spec) => {
  const headers = spec.rawHeaders.map(header => `#SBATCH ${header}`).join('\n')

  // as per https://my.nersc.gov/script_generator.php
  const c = 64 / Math.min(32, spec.p)

  return `#!/bin/bash -l
#SBATCH -p ${spec.q}
#SBATCH -N ${Math.ceil(spec.width / 32)}
#SBATCH -t ${spec.wall}
#SBATCH -D ${spec.cwd}
#SBATCH -C haswell
#SBATCH -e experiments/results/${spec.epoch}/stderr/${spec.name}.err
#SBATCH -o experiments/results/${spec.epoch}/stdout/${spec.name}.out
${headers}

export OMP_PLACES=threads
export OMP_PROC_BIND=spread

MPIRUN="srun -n ${spec.p} -c ${c} --cpu_bind=cores ${spec.runFlags.join(' ')}"

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
