import 'three/examples/js/loaders/OBJLoader'
import { OBJLoader } from 'three'
import obj from './shapes.obj'

const group = new OBJLoader().parse(obj)
export default group.children.reduce((acc, m) => {
  const { name, geometry } = m
  acc[name] = geometry
  return acc
}, {})
