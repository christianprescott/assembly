import { Box, Vec3 } from 'cannon'
import shapes from '../../test/fixtures/shapes'
import shapeFromGeometry from '../shapeFromGeometry'

describe('shapeFromGeometry', function () {
  function expectVec3Eq (v1, v2) {
    expect(v1.almostEquals(v2)).to.eq(true, `expected ${v1} to equal ${v2}`)
  }

  context('Box', () => {
    it('returns geometry bounding box', function () {
      const { shape } = shapeFromGeometry(shapes.boxCube)
      expect(shape).to.be.instanceOf(Box)
      expectVec3Eq(shape.halfExtents, new Vec3(0.5, 0.5, 0.5))
    })
  })
})
