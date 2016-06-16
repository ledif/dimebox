const expect = require('chai').expect,
      resolve = require('../lib/util/epochs/resolve')

const epochs = ['a','b','c','d','e','f','g']

describe('epoch resolve', function(){
  it('non-symbolic epoch', function(){
     const e = resolve('20160615-012345', epochs)
     expect(e).to.be.eql('20160615-012345')
  });

  it('HEAD', function(){
     const e = resolve('HEAD', epochs)
     expect(e).to.be.eql('a')
  });

  it('HEAD~', function(){
     const e = resolve('HEAD~', epochs)
     expect(e).to.be.eql('b')
  });

  it('HEAD~~~', function(){
     const e = resolve('HEAD~~~', epochs)
     expect(e).to.be.eql('d')
  });

  it('HEAD~2', function(){
     const e = resolve('HEAD~2', epochs)
     expect(e).to.be.eql('c')
  });

  it('HEAD~2~2', function(){
     const e = resolve('HEAD~2~2', epochs)
     expect(e).to.be.eql('e')
  });

  it('HEAD~20', function(){
     expect(() => resolve('HEAD~20', epochs)).to.throw(Error)
  });
})
