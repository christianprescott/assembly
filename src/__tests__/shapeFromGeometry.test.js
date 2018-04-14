import { Box } from 'cannon'
import { Geometry, Vector3 } from 'three'
import shapes from '../../test/fixtures/shapes'
import shapeFromGeometry from '../shapeFromGeometry'
import { toThree } from '../scale'

function round (v) {
  // default precision is 1e-6
  return Math.round(v * 1e4) / 1e4
}

function sortArraysByValues (a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    const diff = a[i] - b[i]
    if (diff !== 0) return diff
  }
  return a.length - b.length
}

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
  function recognizes (geometry, expectedExtents, expectedOffset) {
    const { orientation, shape } = shapeFromGeometry(geometry)

    it('recognizes as Box', function () {
      expect(shape).to.be.instanceOf(Box)
    })

    it('sizes extents', function () {
      unorderedEql(
        toThree(shape.halfExtents).toArray().map(round),
        expectedExtents.toArray().map(round).map(v => v / 2),
      )
    })

    it('orients', function () {
      const vertices = shape.convexPolyhedronRepresentation.vertices
        .map(v => orientation.vmult(v))
        .map(v => toThree(v).toArray().map(round))

      const g = new Geometry().fromBufferGeometry(geometry)
      g.mergeVertices()
      const expectedVertices = g.vertices.map(v => v.sub(expectedOffset).toArray().map(round))

      expect(vertices.sort(sortArraysByValues)).to.eql(expectedVertices.sort(sortArraysByValues))
    })
  }

  context('Box', () => {
    context('boxCube', function () {
      recognizes(
        shapes.boxCube,
        new Vector3(1.0, 1.0, 1.0),
        new Vector3(0, 0, 0),
      )
    })

    context('boxWide', function () {
      recognizes(
        shapes.boxWide,
        new Vector3(2.0, 1.0, 0.75),
        new Vector3(2, 0, 0),
      )
    })

    context('boxRotateSingleAxis', function () {
      recognizes(
        shapes.boxRotateSingleAxis,
        new Vector3(2.0, 0.5, 0.1),
        new Vector3(4, 0, 0),
      )
    })

    context('boxRotateMultiAxis', function () {
      recognizes(
        shapes.boxRotateMultiAxis,
        new Vector3(2.0, 0.5, 0.1),
        new Vector3(6, 0, 0),
      )
    })

    // TODO: test non-box shapes boxTrapezoid and boxWarped
  })
  // TODO: test sphere, cylinder
})
