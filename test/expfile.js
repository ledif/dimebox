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
    const exp = _.assign({epilogue: "bar", prologue: "foo"}, base)
     expect(() => validate(exp)).to.not.throw(Error)
  });

  it('field not in whitelist', function(){
    const exp = _.assign({custom: "bar"}, base)
     expect(() => validate(exp)).to.throw(Error)
  });
})

describe('expfile field validation', function(){
  it('should validate if pairargs are all the same length', function(){
     const pairargs = { pairargs: { a: [1,2],  b: [1,2], c: [1,2,3] } }
     const check = () => validate(_.assign(pairargs, base))
     expect(check).not.to.throw
  });

  it('should fail to validate if pairargs are not all the same length', function(){
     const badPairargs = { pairargs: { a: [1,2],  b: [1,2], c: [1,2,3] } }
     const check = () => validate(_.assign(badPairargs, base))
     expect(check).to.throw(/not.*same length/i)
  });

  it('should not fail if using weakargs example', function(){
     const weakargs = { weakargs: '11 + log2(p)' }
     const check = () => validate(_.assign(weakargs, base))
     expect(check).not.to.throw
  });
  it('should not fail if using a string weakargs', function(){
     const weakargs = { weakargs: '""+p' }
     const check = () => validate(_.assign(weakargs, base))
     expect(check).not.to.throw
  });
  it('should fail if weakargs return objects', function(){
     const objWeakargs = { weakargs: '{ foo: 1}' }
     const check = () => validate(_.assign(objWeakargs, base))
     expect(check).to.throw(Error)
  });
  it('should fail if weakargs has syntax errors', function(){
     const badWeakargs = { weakargs: 'return "p' }
     const check = () => validate(_.assign(badWeakargs, base))
     expect(check).to.throw(Error)
  });
})
