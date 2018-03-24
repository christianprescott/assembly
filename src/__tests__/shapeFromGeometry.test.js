import { Box, Vec3 } from 'cannon'
import shapes from '../../test/fixtures/shapes'
import shapeFromGeometry from '../shapeFromGeometry'

const assert = require('assert')

describe('shapeFromGeometry', function () {
  context('Box', () => {
    it('returns geometry bounding box', function () {
      const { shape } = shapeFromGeometry(shapes.boxCube)
      assert.ok(shape instanceof Box)
      assert.ok(shape.halfExtents.almostEquals(new Vec3(0.5, 0.5, 0.5)))
    })
  })
})
