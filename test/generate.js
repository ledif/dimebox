const expect = require('chai').expect,
      _ = require('lodash'),
      yaml = require('js-yaml')
      jobs = require('../lib/generate/jobs')

function structuredJobs(jobs) {
  return _.map(jobs, job => {
    return {
      filename: job.filename,
      contents: yaml.safeLoad(job.contents)
    }
  })
}

const tmpl = require('../lib/machines/debug').template
const exp = { name: '-', wall: '-', desc: '-', depth:[1], p: [1, 2, 4, 8, 16] , cmd: {hello: "./hello"} }
const expObjs = { weakargs: {} }
const optargs = { optargs: {k: [0, 1], q: ['a', 'b', 'c'], w: ["my string", "your string"]} }
const pairargs = { pairargs: { a: [0,1,2], b: [20,30,40], c: [100,200,300] } }
const epoch = '20160101-000000'

describe('trivial generateJobs', function(){
  it('number of jobs equal to product of optargs and p', function(){
     const j = jobs.generateJobs(tmpl, _.extend({}, exp, optargs), expObjs, epoch)
     expect(j).to.have.length(5*2*3*2);
  });

  it('number of jobs equal to product of length of pairargs and p', function(){
     const j = jobs.generateJobs(tmpl, _.extend({}, exp, pairargs), expObjs, epoch)
     expect(j).to.have.length(5*3);
  });

  it('number of jobs equal to product of optargs, length of pairargs and p', function(){
     const j = jobs.generateJobs(tmpl, _.extend({}, exp, optargs, pairargs), expObjs, epoch)
     expect(j).to.have.length(5*3*3*2*2);
  });

  it('jobs is array of objects', function(){
     const j = jobs.generateJobs(tmpl, exp, expObjs, epoch)
     expect(j).to.be.a('array');
     
     j.forEach(job => {
       expect(job).to.have.all.keys('filename', 'contents')
     })
  });

  it('jobs have filenames and are not empty', function(){
     const j = jobs.generateJobs(tmpl, exp, expObjs, epoch)
     j.forEach(job => {
       expect(job.filename).to.have.length.least(1)
       expect(job.contents).to.have.length.least(1)
     })
  });

  it('optargs with spaces do not have spaces in filename', function(){
     const j = jobs.generateJobs(tmpl, exp, expObjs, epoch)
     j.forEach(job => {
       expect(job.filename).to.not.contain(" ")
     })
  });
})

describe('simple generateJobs', function(){
  it('p is same as the filename and exp', function(){
     const js = structuredJobs(jobs.generateJobs(tmpl, exp, expObjs, epoch))
     js.forEach(j => {
       const job = j.contents
       const filename = j.filename.split('-')
       const pFromFile = Number(filename[filename.length-2].split('.')[0])
       expect(job.p).to.be.equal(pFromFile)
       expect(job.p).to.be.oneOf(exp.p)
     });
  });

  it('depth is same as the filename and exp', function(){
     const js = structuredJobs(jobs.generateJobs(tmpl, exp, expObjs, epoch))
     js.forEach(j => {
       const job = j.contents
       const filename = j.filename.split('-')
       const dFromFile = Number(filename[filename.length-1].split('.')[0])
       expect(job.depth).to.be.equal(dFromFile)
       expect(job.depth).to.be.oneOf(exp.depth)
     });
  });
})


describe('actual machines', function(){
  const machines = ['vulcan', 'rain', 'edison']

  it('generated something', function(){
     machines.forEach(m => {
      const machineTemplate = require('../lib/machines/' + m).template
       const js = jobs.generateJobs(machineTemplate, exp, expObjs, epoch)
       js.forEach(j => {
         const job = j.contents
         expect(job).to.be.not.empty
       });
     });
  });

})
