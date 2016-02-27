const expect = require('chai').expect,
      _ = require('underscore'),
      jobs = require('../lib/generate/jobs')

const tmpl = require('../lib/machine/rain').template
const exp = { name: '-', wall: '-', desc: '-', p: [1, 2, 4, 8, 16], optargs: {k: [0, 1], q: ['a', 'b', 'c']} }
const epoch = '20160101-000000'

describe('trivial generateJobs', function(){
  it('number of jobs equal to product of optargs and p', function(){
     const j = jobs.generateJobs(tmpl, exp, epoch)
     expect(j).to.have.length(5*2*3);
  });

  it('jobs is array of objects', function(){
     const j = jobs.generateJobs(tmpl, exp, epoch)
     expect(j).to.be.a('array');
     
     j.map(job => {
       expect(job).to.have.all.keys('filename', 'contents')
     })
  });
})
