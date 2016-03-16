const tmpl = (name, p, wall, epoch, cmd, q, cwd) => `
#PBS -l mppwidth=${p}
#PBS -l walltime=${wall}
#PBS -N ${name}
#PBS -e experiments/results/${epoch}/stderr/${name}.$PBS_JOBID.err 
#PBS -o experiments/results/${epoch}/stdout/${name}.$PBS_JOBID.out 
#PBS -V 

MPIRUN="aprun -n ${p}"

${cmd}`

module.exports = {
  template: tmpl,
  submit: 'qsub',
  submitArgs: {
    depend: (prev) => `-l depend=${prev}`
  }
}
