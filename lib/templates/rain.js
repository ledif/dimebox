const t = `
#PBS -l mppwidth=${p}
#PBS -l mppnppn=32
#PBS -l walltime=${wall}
#PBS -N ${name}
#PBS -e ${name}.$$PBS_JOBID.err 
#PBS -o ${name}.$$PBS_JOBID.out 
#PBS -V 

cd $$PBS_O_WORKDIR

dir=results/${time}
mkdir -p $$dir
`

export default t
