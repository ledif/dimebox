const expect = require('chai').expect,
      _      = require('lodash')
      manipulate = require('../lib/parse/manipulate')

const df = {
  header: ["a", "b", "c", "_d"],
  rows: [
    [Number(0.1), 2, 'a', 0],
    [Number(0.5), 20, 'z', 1],
    [Number(10.1), -2, '!foo', 2]
  ]
}

describe('manipulate#select', function() {
  it('two cols', function() {
     const m = manipulate(df, {select: "a,c"})

     expect(m.header).to.have.length(2)
     expect(m.header).to.eql(["a", "c"])

     expect(m.rows[0]).to.eql([Number(0.1), 'a'])
     expect(m.rows[1]).to.eql([Number(0.5), 'z'])
     expect(m.rows[2]).to.eql([Number(10.1), '!foo'])
  });

  it('all cols', function() {
     const m = manipulate(df, {select: "a,b,c,_d"})

     expect(m).to.eql(df)
  });

  it('different order', function() {
     const m = manipulate(df, {select: "c,b"})

     expect(m.header).to.have.length(2)
     expect(m.header).to.eql(["c", "b"])

     expect(m.rows[0]).to.eql(['a', 2])
     expect(m.rows[1]).to.eql(['z', 20])
     expect(m.rows[2]).to.eql(['!foo', -2])
  });

  it('wrong column name', function() {
     expect(() => manipulate(df, {select: "x"})).to.throw(Error)
  });

  it('leading underscore', function() {
     const m = manipulate(df, {select: "a,d"})

     expect(m.header).to.have.length(2)
     expect(m.header).to.eql(["a", "_d"])

     expect(m.rows[0]).to.eql([Number(0.1), 0])
     expect(m.rows[1]).to.eql([Number(0.5), 1])
     expect(m.rows[2]).to.eql([Number(10.1), 2])
  });

  it('ambiguous underscore', function() {
     const adf = { header: ["p", "_p"], rows: [[0, 2]]}
     const m = manipulate(adf, {select: "p"})

     expect(m.header).to.eql(["p"])
     expect(m.rows[0]).to.eql([0])

     const _m = manipulate(adf, {select: "_p"})
     expect(_m.header).to.eql(["_p"])
     expect(_m.rows[0]).to.eql([2])
  });
})

const df2 = {
  header: ["a", "b", "_c"],
  rows: [
    [2, 20, 'a'],
    [2, 0, 'z'],
    [3, -2, '!foo'],
    [13, -500, '!bar']
  ]
}

describe('manipulate#order', function() {
  it('two cols both asc', function() {
     const m = manipulate(df2, {order: "a,b"})

     expect(m.header).to.eql(df2.header)

     expect(m.rows[0]).to.eql([2, 0, 'z'])
     expect(m.rows[1]).to.eql([2, 20, 'a'])
     expect(m.rows[2]).to.eql([3, -2, '!foo'])
     expect(m.rows[3]).to.eql([13, -500, '!bar'])
  });

  it('two cols, one asc', function() {
     const m = manipulate(df2, {order: "~b,_c"})

     expect(m.header).to.eql(df2.header)

     expect(m.rows[0]).to.eql([2, 20, 'a'])
     expect(m.rows[1]).to.eql([2, 0, 'z'])
     expect(m.rows[2]).to.eql([3, -2, '!foo'])
     expect(m.rows[3]).to.eql([13, -500, '!bar'])
  });

  it('leading underscore', function() {
     const m = manipulate(df2, {order: "~b,c"})

     expect(m.header).to.eql(df2.header)

     expect(m.rows[0]).to.eql([2, 20, 'a'])
     expect(m.rows[1]).to.eql([2, 0, 'z'])
     expect(m.rows[2]).to.eql([3, -2, '!foo'])
     expect(m.rows[3]).to.eql([13, -500, '!bar'])
  });
})
