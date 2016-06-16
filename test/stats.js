const expect = require('chai').expect,
      stats = require('../lib/parse/stats')

const tenNums = [5.232405283022672,
0.3472179570235312,
4.086789721623063,
6.360535882413387,
3.300832014065236,
7.874558444600552,
0.47707584453746676,
4.030399369075894,
2.0213337219320238,
0.5420976644381881
]

const epsilon = 0.00001

describe('statistics for 10 values', function(){
  it('simple stats', function(){
     const st = stats(tenNums)
     expect(st.mean).to.be.closeTo(3.42732, epsilon)
     expect(st.min).to.be.closeTo(0.3472179570235312, epsilon)
     expect(st.max).to.be.closeTo(7.874558444600552, epsilon)
     expect(st.stddev).to.be.closeTo(2.46874, epsilon)
     expect(st.conf).to.be.closeTo(2.22814*(2.46874/Math.sqrt(10)), epsilon)
     expect(st.samples).to.eql(10)
  });
})
