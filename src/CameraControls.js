/* eslint-disable no-mixed-operators */

// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/controls/OrbitControls.js

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

import {
  EventDispatcher,
  MOUSE,
  Quaternion,
  Spherical,
  Vector2,
  Vector3,
} from 'three'

const STATE = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_DOLLY: 4,
  TOUCH_PAN: 5,
}
const EPS = 0.000001
const EVENT = {
  CHANGE: { type: 'change' },
  START: { type: 'start' },
  END: { type: 'end' },
}

export default class CameraControls {
  //
  // configuration
  //

  // Set to false to disable this control
  enabled = true
  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  enableZoom = true
  zoomSpeed = 1.0
  // Set to false to disable rotating
  enableRotate = true
  rotateSpeed = 1.0
  // Set to false to disable panning
  enablePan = true
  keyPanSpeed = 7.0; // pixels moved per arrow key push
  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  enableDamping = false
  dampingFactor = 0.25
  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  autoRotate = false
  autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // Set to false to disable use of the keys
  enableKeys = true
  // The four arrow keys
  keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 }
  // Mouse buttons
  mouseButtons = {
    ORBIT: MOUSE.RIGHT,
    ZOOM: MOUSE.MIDDLE,
    PAN: MOUSE.LEFT,
  }

  // "target" sets the location of focus, where the object orbits around
  target = new Vector3()

  // How far you can dolly in and out ( PerspectiveCamera only )
  minDistance = 0
  maxDistance = Infinity
  // How far you can zoom in and out ( OrthographicCamera only )
  minZoom = 0
  maxZoom = Infinity
  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  minPolarAngle = 0; // radians
  maxPolarAngle = Math.PI; // radians
  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  minAzimuthAngle = -Infinity; // radians
  maxAzimuthAngle = Infinity; // radians

  //
  // internals
  //

  state = STATE.NONE

  // current position in spherical coordinates
  spherical = new Spherical()
  sphericalDelta = new Spherical()

  scale = 1
  panOffset = new Vector3()
  zoomChanged = false

  rotateStart = new Vector2()
  rotateEnd = new Vector2()
  rotateDelta = new Vector2()

  panStart = new Vector2()
  panEnd = new Vector2()
  panDelta = new Vector2()

  dollyStart = new Vector2()
  dollyEnd = new Vector2()
  dollyDelta = new Vector2()

  // update
  updateOffset = new Vector3()
  updateLastPosition = new Vector3()
  updateLastQuaternion = new Quaternion()

  // pan
  panLeftDiff = new Vector3()
  panUpDiff = new Vector3()
  panDiff = new Vector3()

  // for reset
  target0 = new Vector3()
  position0 = new Vector3()
  zoom0 = 1

  constructor (object, domElement) {
    this.object = object
    // so camera.up is the orbit axis
    this.updateQuat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0))
    this.updateQuatInverse = this.updateQuat.clone().inverse()

    this.domElement = (domElement !== undefined) ? domElement : document
    this.domElement.addEventListener('contextmenu', this.onContextMenu, false)
    this.domElement.addEventListener('mousedown', this.onMouseDown, false)
    this.domElement.addEventListener('wheel', this.onMouseWheel, false)
    this.domElement.addEventListener('touchstart', this.onTouchStart, false)
    this.domElement.addEventListener('touchend', this.onTouchEnd, false)
    this.domElement.addEventListener('touchmove', this.onTouchMove, false)
    window.addEventListener('keydown', this.onKeyDown, false)

    this.saveState()
    this.update()
  }

  //
  // public methods
  //

  getPolarAngle () {
    return this.spherical.phi
  }

  getAzimuthalAngle () {
    return this.spherical.theta
  }

  saveState () {
    this.target0.copy(this.target)
    this.position0.copy(this.object.position)
    this.zoom0 = this.object.zoom
  }

  reset () {
    this.target.copy(this.target0)
    this.object.position.copy(this.position0)
    this.object.zoom = this.zoom0

    this.object.updateProjectionMatrix()
    this.dispatchEvent(EVENT.CHANGE)

    this.update()

    this.state = STATE.NONE
  }

  // this method is exposed, but perhaps it would be better if we can make it private...
  update () {
    this.updateOffset.copy(this.object.position).sub(this.target)
    // rotate offset to "y-axis-is-up" space
    this.updateOffset.applyQuaternion(this.updateQuat)

    // angle from z-axis around y-axis
    this.spherical.setFromVector3(this.updateOffset)
    if (this.autoRotate && this.state === STATE.NONE) {
      this.rotateLeft(this.getAutoRotationAngle())
    }
    this.spherical.theta += this.sphericalDelta.theta
    this.spherical.phi += this.sphericalDelta.phi
    // restrict theta to be between desired limits
    this.spherical.theta = Math.max(
      this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta),
    )
    // restrict phi to be between desired limits
    this.spherical.phi = Math.max(
      this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi),
    )
    this.spherical.makeSafe()

    this.spherical.radius *= this.scale
    // restrict radius to be between desired limits
    this.spherical.radius = Math.max(
      this.minDistance, Math.min(this.maxDistance, this.spherical.radius),
    )

    // move target to panned location
    this.target.add(this.panOffset)

    this.updateOffset.setFromSpherical(this.spherical)
    // rotate this.updateOffset back to "camera-up-vector-is-up" space
    this.updateOffset.applyQuaternion(this.updateQuatInverse)
    this.object.position.copy(this.target).add(this.updateOffset)
    this.object.lookAt(this.target)

    if (this.enableDamping === true) {
      this.sphericalDelta.theta *= (1 - this.dampingFactor)
      this.sphericalDelta.phi *= (1 - this.dampingFactor)
    } else {
      this.sphericalDelta.set(0, 0, 0)
    }

    this.scale = 1
    this.panOffset.set(0, 0, 0)

    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8
    if (this.zoomChanged ||
      this.updateLastPosition.distanceToSquared(this.object.position) > EPS ||
      8 * (1 - this.updateLastQuaternion.dot(this.object.quaternion)) > EPS) {
      this.dispatchEvent(EVENT.CHANGE)

      this.updateLastPosition.copy(this.object.position)
      this.updateLastQuaternion.copy(this.object.quaternion)
      this.zoomChanged = false

      return true
    }

    return false
  }

  dispose () {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu, false)
    this.domElement.removeEventListener('mousedown', this.onMouseDown, false)
    this.domElement.removeEventListener('wheel', this.onMouseWheel, false)
    this.domElement.removeEventListener('touchstart', this.onTouchStart, false)
    this.domElement.removeEventListener('touchend', this.onTouchEnd, false)
    this.domElement.removeEventListener('touchmove', this.onTouchMove, false)
    document.removeEventListener('mousemove', this.onMouseMove, false)
    document.removeEventListener('mouseup', this.onMouseUp, false)
    window.removeEventListener('keydown', this.onKeyDown, false)
    // this.dispatchEvent( { type: 'dispose' } ); // should this be added here?
  }

  getAutoRotationAngle () {
    return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed
  }

  getZoomScale () {
    return 0.95 ** this.zoomSpeed
  }

  rotateLeft (angle) {
    this.sphericalDelta.theta -= angle
  }

  rotateUp (angle) {
    this.sphericalDelta.phi -= angle
  }

  panLeft (distance, objectMatrix) {
    this.panLeftDiff.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
    this.panLeftDiff.multiplyScalar(-distance)
    this.panOffset.add(this.panLeftDiff)
  }

  panUp (distance, objectMatrix) {
    this.panUpDiff.setFromMatrixColumn(objectMatrix, 1); // get Y column of objectMatrix
    this.panUpDiff.multiplyScalar(distance)
    this.panOffset.add(this.panUpDiff)
  }

  // deltaX and deltaY are in pixels; right and down are positive
  pan (deltaX, deltaY) {
    const element = this.domElement === document ? this.domElement.body : this.domElement

    if (this.object.isPerspectiveCamera) {
      // perspective
      this.panDiff.copy(this.object.position).sub(this.target)
      let targetDistance = this.panDiff.length()

      // half of the fov is center to top of screen
      targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0)

      // we actually don't use screenWidth, since perspective camera is fixed to screen height
      this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix)
      this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix)
    } else if (this.object.isOrthographicCamera) {
      // orthographic
      this.panLeft(
        deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth,
        this.object.matrix,
      )
      this.panUp(
        deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight,
        this.object.matrix,
      )
    } else {
      // camera neither orthographic nor perspective
      this.enablePan = false
      throw new Error('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.')
    }
  }

  dollyIn (dollyScale) {
    if (this.object.isPerspectiveCamera) {
      this.scale /= dollyScale
    } else if (this.object.isOrthographicCamera) {
      this.object.zoom = Math.max(
        this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale),
      )
      this.object.updateProjectionMatrix()
      this.zoomChanged = true
    } else {
      this.enableZoom = false
      throw new Error('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
    }
  }

  dollyOut (dollyScale) {
    if (this.object.isPerspectiveCamera) {
      this.scale *= dollyScale
    } else if (this.object.isOrthographicCamera) {
      this.object.zoom = Math.max(
        this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale),
      )
      this.object.updateProjectionMatrix()
      this.zoomChanged = true
    } else {
      this.enableZoom = false
      throw new Error('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.')
    }
  }

  //
  // event callbacks - update the object state
  //

  handleMouseDownRotate (event) {
    this.rotateStart.set(event.clientX, event.clientY)
  }

  handleMouseDownDolly (event) {
    this.dollyStart.set(event.clientX, event.clientY)
  }

  handleMouseDownPan (event) {
    this.panStart.set(event.clientX, event.clientY)
  }

  handleMouseMoveRotate (event) {
    this.rotateEnd.set(event.clientX, event.clientY)
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart)

    const element = this.domElement === document ? this.domElement.body : this.domElement
    // rotating across whole screen goes 360 degrees around
    this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed)
    // rotating up and down along whole screen attempts to go 360, but limited to 180
    this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed)
    this.rotateStart.copy(this.rotateEnd)

    this.update()
  }

  handleMouseMoveDolly (event) {
    this.dollyEnd.set(event.clientX, event.clientY)
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart)

    if (this.dollyDelta.y > 0) {
      this.dollyIn(this.getZoomScale())
    } else if (this.dollyDelta.y < 0) {
      this.dollyOut(this.getZoomScale())
    }

    this.dollyStart.copy(this.dollyEnd)
    this.update()
  }

  handleMouseMovePan (event) {
    this.panEnd.set(event.clientX, event.clientY)
    this.panDelta.subVectors(this.panEnd, this.panStart)

    this.pan(this.panDelta.x, this.panDelta.y)

    this.panStart.copy(this.panEnd)
    this.update()
  }

  handleMouseWheel (event) {
    if (event.deltaY < 0) {
      this.dollyOut(this.getZoomScale())
    } else if (event.deltaY > 0) {
      this.dollyIn(this.getZoomScale())
    }

    this.update()
  }

  handleKeyDown (event) {
    switch (event.keyCode) {
      case this.keys.UP:
        this.pan(0, this.keyPanSpeed)
        this.update()
        break
      case this.keys.BOTTOM:
        this.pan(0, -this.keyPanSpeed)
        this.update()
        break
      case this.keys.LEFT:
        this.pan(this.keyPanSpeed, 0)
        this.update()
        break
      case this.keys.RIGHT:
        this.pan(-this.keyPanSpeed, 0)
        this.update()
        break
      default:
        // nothing
    }
  }

  handleTouchStartRotate (event) {
    this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY)
  }

  handleTouchStartDolly (event) {
    const dx = event.touches[0].pageX - event.touches[1].pageX
    const dy = event.touches[0].pageY - event.touches[1].pageY
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.dollyStart.set(0, distance)
  }

  handleTouchStartPan (event) {
    this.panStart.set(event.touches[0].pageX, event.touches[0].pageY)
  }

  handleTouchMoveRotate (event) {
    this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY)
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart)

    const element = this.domElement === document ? this.domElement.body : this.domElement
    // rotating across whole screen goes 360 degrees around
    this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed)
    // rotating up and down along whole screen attempts to go 360, but limited to 180
    this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed)

    this.rotateStart.copy(this.rotateEnd)
    this.update()
  }

  handleTouchMoveDolly (event) {
    const dx = event.touches[0].pageX - event.touches[1].pageX
    const dy = event.touches[0].pageY - event.touches[1].pageY
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.dollyEnd.set(0, distance)
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart)

    if (this.dollyDelta.y > 0) {
      this.dollyOut(this.getZoomScale())
    } else if (this.dollyDelta.y < 0) {
      this.dollyIn(this.getZoomScale())
    }

    this.dollyStart.copy(this.dollyEnd)
    this.update()
  }

  handleTouchMovePan (event) {
    this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY)
    this.panDelta.subVectors(this.panEnd, this.panStart)
    this.pan(this.panDelta.x, this.panDelta.y)

    this.panStart.copy(this.panEnd)
    this.update()
  }

  //
  // event handlers - FSM: listen for events and reset state
  //

  onMouseDown = (event) => {
    if (this.enabled === false) return
    event.preventDefault()

    switch (event.button) {
      case this.mouseButtons.ORBIT:
        if (this.enableRotate === false) return
        this.handleMouseDownRotate(event)
        this.state = STATE.ROTATE
        break
      case this.mouseButtons.ZOOM:
        if (this.enableZoom === false) return
        this.handleMouseDownDolly(event)
        this.state = STATE.DOLLY
        break
      case this.mouseButtons.PAN:
        if (this.enablePan === false) return
        this.handleMouseDownPan(event)
        this.state = STATE.PAN
        break
      default:
        // nothing
    }

    if (this.state !== STATE.NONE) {
      document.addEventListener('mousemove', this.onMouseMove, false)
      document.addEventListener('mouseup', this.onMouseUp, false)
      this.dispatchEvent(EVENT.START)
    }
  }

  onMouseMove = (event) => {
    if (this.enabled === false) return
    event.preventDefault()

    switch (this.state) {
      case STATE.ROTATE:
        if (this.enableRotate === false) return
        this.handleMouseMoveRotate(event)
        break
      case STATE.DOLLY:
        if (this.enableZoom === false) return
        this.handleMouseMoveDolly(event)
        break
      case STATE.PAN:
        if (this.enablePan === false) return
        this.handleMouseMovePan(event)
        break
      default:
        // nothing
    }
  }

  onMouseUp = () => {
    if (this.enabled === false) return

    document.removeEventListener('mousemove', this.onMouseMove, false)
    document.removeEventListener('mouseup', this.onMouseUp, false)

    this.dispatchEvent(EVENT.END)
    this.state = STATE.NONE
  }

  onMouseWheel = (event) => {
    if (this.enabled === false ||
      this.enableZoom === false ||
      (this.state !== STATE.NONE && this.state !== STATE.ROTATE)) return
    event.preventDefault()
    event.stopPropagation()

    this.handleMouseWheel(event)

    this.dispatchEvent(EVENT.START); // not sure why these are here...
    this.dispatchEvent(EVENT.END)
  }

  onKeyDown = (event) => {
    if (this.enabled === false || this.enableKeys === false || this.enablePan === false) return

    this.handleKeyDown(event)
  }

  // TODO: distinguish two-finger rotate and dolly. May need to delay the state
  // change until we can determine the action
  onTouchStart = (event) => {
    if (this.enabled === false) return

    switch (event.touches.length) {
      case 2: // one-fingered touch: rotate
        if (this.enableRotate === false) return
        this.handleTouchStartRotate(event)
        this.state = STATE.TOUCH_ROTATE
        break
      // case 2: // two-fingered touch: dolly
      //   if (this.enableZoom === false) return
      //   this.handleTouchStartDolly(event)
      //   this.state = STATE.TOUCH_DOLLY
      //   break
      case 3: // three-fingered touch: pan
        if (this.enablePan === false) return
        this.handleTouchStartPan(event)
        this.state = STATE.TOUCH_PAN
        break
      default:
        this.state = STATE.NONE
    }

    if (this.state !== STATE.NONE) {
      this.dispatchEvent(EVENT.START)
    }
  }

  onTouchMove = (event) => {
    if (this.enabled === false) return
    event.preventDefault()
    event.stopPropagation()

    switch (event.touches.length) {
      case 2: // one-fingered touch: rotate
        if (this.enableRotate === false) return
        if (this.state !== STATE.TOUCH_ROTATE) return; // is this needed?...
        this.handleTouchMoveRotate(event)
        break
      // case 2: // two-fingered touch: dolly
      //   if (this.enableZoom === false) return
      //   if (this.state !== STATE.TOUCH_DOLLY) return; // is this needed?...
      //   this.handleTouchMoveDolly(event)
      //   break
      case 3: // three-fingered touch: pan
        if (this.enablePan === false) return
        if (this.state !== STATE.TOUCH_PAN) return; // is this needed?...
        this.handleTouchMovePan(event)
        break
      default:
        this.state = STATE.NONE
    }
  }

  onTouchEnd = () => {
    if (this.enabled === false) return
    this.dispatchEvent(EVENT.END)
    this.state = STATE.NONE
  }

  onContextMenu = (event) => {
    if (this.enabled === false) return
    event.preventDefault()
  }
}

Object.assign(CameraControls.prototype, EventDispatcher.prototype)
