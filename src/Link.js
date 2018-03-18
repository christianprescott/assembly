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

const MAT_LINE = new LineDashedMaterial({ color: 0x22ccff, dashSize: 0.05, gapSize: 0.15 })
const MAT_ARROW = new MeshBasicMaterial({ color: 0x22ccff, wireframe: true })
const MAT_ARROW_LINKED = new MeshBasicMaterial({ color: 0x22ff22, wireframe: true })
const GEO_ARROW = new Geometry().setFromPoints([
  new Vector3(0, 0, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0.1, 0),
])
GEO_ARROW.faces.push(new Face3(0, 1, 2))
const POINT = [
  new Vector3(0, 1, 0),
  new Vector3(-0.2, 1, 0.2),
  new Vector3(-0.2, 1, -0.2),
  new Vector3(0, 1, 0),
]

export default class Link extends Object3D {
  static create (meshA, meshB) {
    const meshes = [meshA, meshB]
    if (!meshes.every(m => m instanceof Mesh)) throw new Error('meshes must be present')
    if (meshA === meshB) throw new Error('cannot link mesh to itself')

    const componentIndex = meshes.findIndex(m => m instanceof Component)
    if (componentIndex < 0) throw new Error('cannot link two fixtures')
    const component = meshes[componentIndex]
    const other = meshes[1 - componentIndex]
    const notLinked = component.links.every(l => !l.meshes().includes(other))
    if (!notLinked) throw new Error('these meshes are already linked')

    return new Link(meshA, meshB)
  }

  constructor (meshA, meshB) {
    super()
    Object.assign(this, { meshA, meshB })

    this.position.subVectors(meshB.position, meshA.position)
    meshA.add(this)

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

    this.meshes()
      .filter(m => m instanceof Component)
      .forEach(c => c.links.push(this))
  }

  meshes () {
    return [this.meshA, this.meshB]
  }

  getDistance () {
    // from meshA THREE mesh to meshB CANNON body
    const distance = this.getWorldPosition().distanceTo(this.meshB.body.position)
    const [axis, angle] = this.meshB.body.quaternion.toAxisAngle()
    if (DEBUG) {
      // Position distance
      this.line.geometry.vertices[1].subVectors(this.meshB.body.position, this.getWorldPosition())
      this.line.geometry.verticesNeedUpdate = true
      this.line.geometry.lineDistancesNeedUpdate = true
      this.line.geometry.computeLineDistances()
      // Rotation distance
      // TODO: This doesn't quite point in the direction it should... but the curve with
      // angle is useful
      this.curve.aEndAngle = angle
      this.arc.geometry.setFromPoints(POINT.concat(this.curve.getPoints(12)))
      this.arc.geometry.verticesNeedUpdate = true
      this.arc.quaternion.setFromAxisAngle(new Vector3(0, 0, 1).cross(axis), Math.PI / 2)

      this.arrowMesh.material = distance < 0.05 ? MAT_ARROW_LINKED : MAT_ARROW
      this.arc.material = angle < 0.05 ? MAT_ARROW_LINKED : MAT_ARROW
    }
    return distance
  }
}
