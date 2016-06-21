const expect = require('chai').expect,
      _      = require('lodash'),
      validate = require('../lib/util/expfile').validateExp

const base = {p: [1,2], name: "test", wall: "00:30:00", desc: "blah", cmds: {"foo": "./foo"}}

describe('missing required fields', function(){
  it('missing p', function(){
    const exp = _.omit(base, 'p')
     expect(() => validate(exp)).to.throw(Error)
  });

  it('missing cmds', function(){
    const exp = _.omit(base, 'cmds')
     expect(() => validate(exp)).to.throw(Error)
  });
})

describe('allowed fields', function(){
  it('field in whitelist', function(){
    const exp = _.assign({epilogue: "bar"}, base)
     expect(() => validate(exp)).to.not.throw(Error)
  });

  it('field not in whitelist', function(){
    const exp = _.assign({custom: "bar"}, base)
     expect(() => validate(exp)).to.throw(Error)
  });
})
