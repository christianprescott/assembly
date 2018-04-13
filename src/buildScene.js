import {
  AmbientLight,
  Color,
  DirectionalLight,
  Object3D,
  Mesh,
  PlaneGeometry,
  MeshToonMaterial,
  Scene,
} from 'three'

const ROOM_SIZE = 2

function buildFloor () {
  // a grid with side length ROOM_SIZE and count grid lines per axis
  const count = 10
  const floor = new Object3D()
  floor.visible = false
  const geometry = new PlaneGeometry(0.02, ROOM_SIZE)
  const material = new MeshToonMaterial({ color: 0x222222 })
  for (let i = 0; i < count; i += 1) {
    const x = ((i / (count - 1)) * ROOM_SIZE) - (ROOM_SIZE / 2)
    const lineY = new Mesh(geometry, material)
    lineY.position.set(x, 0, 0)
    floor.add(lineY)
    const lineX = new Mesh(geometry, material)
    lineX.position.set(0, x, 0)
    lineX.rotation.set(0, 0, Math.PI / 2)
    floor.add(lineX)
  }
  floor.position.set(0, 0, -1)
  return floor
}

export default function () {
  const scene = new Scene()
  scene.background = new Color(0xdddddd)

  // lights
  const ambientLight = new AmbientLight(0x222222)
  const directionalLight = new DirectionalLight(0xffffff, 0.7)
  directionalLight.position.set(3, -1, 2).normalize()
  const shadowLight = new DirectionalLight(0xffffff, 0.2)
  shadowLight.position.set(0, 0, 10)
  shadowLight.castShadow = true
  shadowLight.shadow.mapSize.width = 1024
  shadowLight.shadow.mapSize.height = 1024
  shadowLight.shadow.camera.left = ROOM_SIZE / -2
  shadowLight.shadow.camera.bottom = ROOM_SIZE / -2
  shadowLight.shadow.camera.right = ROOM_SIZE / 2
  shadowLight.shadow.camera.top = ROOM_SIZE / 2
  scene.add(ambientLight, directionalLight, shadowLight)

  const floor = buildFloor()
  scene.userData.floor = floor
  scene.add(floor)

  return scene
}
