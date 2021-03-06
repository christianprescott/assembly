import fscreen from 'fscreen'
import { WebGLRenderer } from 'three'

function _createCanvas (parent) {
  if (!(parent instanceof HTMLElement)) throw new Error('parent must be HTMLElement')

  const container = document.createElement('div')
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.position = 'relative'

  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.position = 'absolute'

  container.appendChild(canvas)
  parent.appendChild(container)
  return { canvas, container }
}

export default class ResponsiveRenderer extends WebGLRenderer {
  constructor (parent, parameters = {}) {
    const { canvas, container } = _createCanvas(parent)
    super(Object.assign({ canvas }, parameters))
    this.container = container
    // TODO: not sure why this dance is necessary. WebGLRenderer seems to be
    // interfering with the typical render () { super.render() }
    this._superRender = this.render
    this.render = this._subRender
  }

  fullscreen () {
    fscreen.requestFullscreen(this.container)
  }

  // private

  _subRender (scene, camera) {
    if (!this.vr.enabled) this._resize(this.container, camera) // :(
    return this._superRender(scene, camera)
  }

  _resize (container, camera) {
    const width = container.clientWidth
    const height = container.clientHeight
    if (container.width !== width || container.height !== height) {
      this.setSize(container.clientWidth, container.clientHeight, false)

      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }
  }
}
