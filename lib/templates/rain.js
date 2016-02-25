const tmpl = (name, p, wall, cmd) => `
#PBS -l mppwidth=${p}
#PBS -l mppnppn=32
#PBS -l walltime=${wall}
#PBS -N ${name}
#PBS -e ${name}.$PBS_JOBID.err 
#PBS -o ${name}.$PBS_JOBID.out 
#PBS -V 

MPIRUN="aprun -n ${p}"

${cmd}`

module.exports = {
  template: tmpl,
  submit: 'qsub'
}
