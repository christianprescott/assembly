import { Box, Quaternion, Vec3 } from 'cannon'
import shapes from '../../test/fixtures/shapes'
import shapeFromGeometry from '../shapeFromGeometry'

function unorderedEql (v1, v2) {
  const other = v2.map(v => v)
  const every = v1.every((v) => {
    const i = other.indexOf(v)
    if (i >= 0) {
      other.splice(i, 1)
      return true
    }
    return false
  })

  expect(every && other.length === 0)
    .to.eq(true, `expected [${v1.join(', ')}] to equal [${v2.join(', ')}]`)
}

describe('shapeFromGeometry', function () {
  // TODO: test offset
  function recognizes (fixture, expectedExtents) {
    context(fixture, function () {
      const { shape } = shapeFromGeometry(shapes[fixture])

      it('recognizes as Box', function () {
        expect(shape).to.be.instanceOf(Box)
      })

      it('sizes extents', function () {
        // default precision is 1e-6
        const round = v => Math.round(v * 1e4) / 1e4
        unorderedEql(
          shape.halfExtents.toArray().map(round),
          expectedExtents.toArray().map(round).map(v => v / 2),
        )
      })

      // TODO: unpredicatable extents and axis alignment make this difficult to test
      it.skip('orients', function () {
      })
    })
  }

  context('Box', () => {
    recognizes(
      'boxCube',
      new Vec3(1.0, 1.0, 1.0),
      new Quaternion(),
    )

    recognizes(
      'boxWide',
      new Vec3(2.0, 1.0, 0.75),
      new Quaternion(),
    )

    recognizes(
      'boxRotateSingleAxis',
      new Vec3(2.0, 0.5, 0.1),
      new Quaternion().setFromEuler(0, 0, -Math.PI / 6),
    )

    recognizes(
      'boxRotateMultiAxis',
      new Vec3(2.0, 0.5, 0.1),
      new Quaternion(),
    )

    // TODO: test non-box shapes boxTrapezoid and boxWarped
  })
  // TODO: test sphere, cylinder
})
