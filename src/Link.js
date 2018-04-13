import {
  EllipseCurve,
  Face3,
  Geometry,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three'
import Component from './Component'
import { toThree } from './scale'

const MAT_LINE = new LineDashedMaterial({ color: 0x22ccff, dashSize: 0.015, gapSize: 0.005 })
const MAT_ARROW = new MeshBasicMaterial({ color: 0x22ccff, wireframe: true })
const MAT_ARROW_LINKED = new MeshBasicMaterial({ color: 0x22ff22, wireframe: true })
const GEO_ARROW = new Geometry().setFromPoints([
  new Vector3(0, 0, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0.01, 0),
])
GEO_ARROW.faces.push(new Face3(0, 1, 2))
const POINT = [
  new Vector3(0, 1, 0),
  new Vector3(-0.2, 1, 0.2),
  new Vector3(-0.2, 1, -0.2),
  new Vector3(0, 1, 0),
]

export default class Link extends Object3D {
  static create (objectA, objectB) {
    const objects = [objectA, objectB]
    if (!objects.every(m => m instanceof Object3D)) throw new Error('objects must be present')
    if (objectA === objectB) throw new Error('cannot link object to itself')

    const componentIndex = objects.findIndex(m => m instanceof Component)
    if (componentIndex < 0) throw new Error('cannot link two fixtures')
    const component = objects[componentIndex]
    const other = objects[1 - componentIndex]
    const notLinked = component.links.every(l => !l.objects().includes(other))
    if (!notLinked) throw new Error('these objects are already linked')

    return new Link(objectA, objectB)
  }

  constructor (objectA, objectB) {
    super()
    Object.assign(this, { objectA, objectB })

    this.position.subVectors(objectB.position, objectA.position)
    objectA.add(this)

    if (DEBUG) {
      // Link indicator
      const length = this.position.length()
      this.arrowMesh = new Mesh(GEO_ARROW, MAT_ARROW)
      this.arrowMesh.position.copy(this.position).negate()
      this.arrowMesh.scale.set(1, 1, length)
      this.arrowMesh.up.set(0, 0, 1)
      this.arrowMesh.lookAt(0, 0, 0)
      this.add(this.arrowMesh)

      // Position target
      const lineGeo = new Geometry().setFromPoints([new Vector3(), new Vector3()])
      lineGeo.computeLineDistances()
      this.line = new Line(lineGeo, MAT_LINE)
      this.add(this.line)

      // Rotation target
      this.curve = new EllipseCurve(
        0, 0,
        1, 1, // xRadius, yRadius
        0, 0, // startAngle, endAngle
        false, // clockwise
        Math.PI / 2, // rotation
      )
      const arcGeo = new Geometry().setFromPoints(this.curve.getPoints(12))
      this.arc = new Line(arcGeo, MAT_LINE)
      this.add(this.arc)
    }

    this.objects()
      .filter(m => m instanceof Component)
      .forEach(c => c.links.push(this))
  }

  objects () {
    return [this.objectA, this.objectB]
  }

  test () {
    // from objectA THREE Object3D to objectB CANNON Body
    const distance = this.getWorldPosition().distanceTo(toThree(this.objectB.body.position))
    const [axis, angle] = this.objectB.body.quaternion.toAxisAngle()
    if (DEBUG) {
      // Position distance
      const lineGeo = this.line.geometry
      toThree(this.objectB.body.position, lineGeo.vertices[1]).sub(this.getWorldPosition())
      lineGeo.verticesNeedUpdate = true
      lineGeo.lineDistancesNeedUpdate = true
      lineGeo.computeLineDistances()
      // Rotation distance
      // TODO: This doesn't quite point in the direction it should... but the curve with
      // angle is useful
      this.curve.aEndAngle = angle
      this.arc.geometry.setFromPoints(POINT.concat(this.curve.getPoints(12)))
      this.arc.geometry.verticesNeedUpdate = true
      this.arc.quaternion.setFromAxisAngle(new Vector3(0, 0, 1).cross(axis), Math.PI / 2)

      this.arrowMesh.material = distance < 0.01 ? MAT_ARROW_LINKED : MAT_ARROW
      this.arc.material = angle < 0.05 ? MAT_ARROW_LINKED : MAT_ARROW
    }
    return distance < 0.01 && angle < 0.05
  }
}
