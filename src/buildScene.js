import {
  AmbientLight,
  Color,
  DirectionalLight,
  Scene,
} from 'three'

export default function () {
  const scene = new Scene()
  scene.background = new Color(0x404040)

  // lights
  const ambientLight = new AmbientLight(0x222222)
  const directionalLight = new DirectionalLight(0xffffff, 1)
  directionalLight.position.set(3, -1, 2).normalize()
  scene.add(ambientLight, directionalLight)

  return scene
}
