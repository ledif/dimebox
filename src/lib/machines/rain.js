const tmpl = (spec) => {
  const headers = spec.rawHeaders.map(header => `#PBS ${header}`).join('\n')
  return `#PBS -l mppwidth=${spec.width}
#PBS -l walltime=${spec.wall}
#PBS -N ${spec.name}
#PBS -e experiments/results/${spec.epoch}/stderr/${spec.name}.$PBS_JOBID.err
#PBS -o experiments/results/${spec.epoch}/stdout/${spec.name}.$PBS_JOBID.out
#PBS -V
${headers}

MPIRUN="aprun -n ${spec.p} -d ${spec.depth} ${spec.runFlags.join(' ')}"

${spec.cmd}`
}

module.exports = {
  template: tmpl,
  submit: 'qsub',
  submitArgs: {
    depend: (prev) => `-l depend=${prev}`
  },
  kill: 'qdel'
}
