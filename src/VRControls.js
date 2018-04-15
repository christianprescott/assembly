// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/vr/ViveController.js

/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */

import {
  EventDispatcher,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Raycaster,
  SphereGeometry,
  Vector3,
} from 'three'

const SQUEEZE_THRESHOLD = 0.8
const BUTTON_MAP = {
  0: 'thumbpad',
  1: 'trigger',
  2: 'grip',
  3: 'menu',
}

export default class TouchControls extends Object3D {
  static findGamepad (id) {
    // Iterate across gamepads as controllers may not be
    // in position 0 and 1.
    const gamepads = navigator.getGamepads && navigator.getGamepads()

    for (let i = 0, j = 0; i < gamepads.length; i += 1) {
      const gamepad = gamepads[i]

      if (gamepad && (gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith('Oculus Touch') || gamepad.id.startsWith('Spatial Controller'))) {
        if (j === id) return gamepad

        j += 1
      }
    }

    // No gamepad with this id
    return undefined
  }

  gamepadId = null
  gamepad = null

  axes = [0, 0]
  thumbpadIsPressed = false
  thumbpadValue = 0.0
  triggerIsPressed = false
  triggerValue = 0.0
  gripIsPressed = false
  gripsValue = 0.0
  menuIsPressed = false
  menuValue = 0.0

  squeezeValue = 0.0

  _objects = []
  _raycaster = new Raycaster()
  _selected = null
  _offsetPosition = new Vector3()
  _offsetQuaternion = new Quaternion()
  _posePosition = new Vector3()
  _poseOrientation = new Quaternion()

  constructor (id, _objects) {
    super()
    this.gamepadId = id
    this.matrixAutoUpdate = false
    this.standingMatrix = new Matrix4()
    this._objects = _objects
    this.ball = new Mesh(new SphereGeometry(0.02, 8, 8))
  }

  activate () {
    this.add(this.ball)
    this.addEventListener('triggerchange', this._onSqueezeChange, false)
    this.addEventListener('gripchange', this._onSqueezeChange, false)
    this.addEventListener('positionchange', this._onPositionChange, false)
    this.addEventListener('quaternionchange', this._onQuaternionChange, false)
  }

  deactivate () {
    this.remove(this.ball)
    this.removeEventListener('triggerchange', this._onSqueezeChange, false)
    this.removeEventListener('gripchange', this._onSqueezeChange, false)
    this.removeEventListener('positionchange', this._onPositionChange, false)
    this.removeEventListener('quaternionchange', this._onQuaternionChange, false)
  }

  dispose () {
    // TODO: remove this from scene?
    Object.values(this._listeners || {}).forEach(v => v.splice(0, v.length))
    this.deactivate()
  }

  getGamepad () {
    return this.gamepad
  }

  getButtonState (button) {
    return !!this[`${button}IsPressed`]
  }

  update () {
    this.gamepad = TouchControls.findGamepad(this.gamepadId)
    const { gamepad } = this

    if (gamepad !== undefined && gamepad.pose !== undefined) {
      if (gamepad.pose === null) return // No user action yet

      //  Position and orientation.

      const { pose } = gamepad
      if (pose.orientation !== null) {
        this._poseOrientation.fromArray(pose.orientation)
        if (!this.quaternion.equals(this._poseOrientation)) {
          this.quaternion.copy(this._poseOrientation)
          this.dispatchEvent({ type: 'quaternionchange', quaternion: this._poseOrientation })
        }
      }
      if (pose.position !== null) {
        this._posePosition.fromArray(pose.position)
        if (!this.position.equals(this._posePosition)) {
          this.position.copy(this._posePosition)
          this.dispatchEvent({ type: 'positionchange', position: this._posePosition })
        }
      }
      this.matrix.compose(this.position, this.quaternion, this.scale)
      this.matrix.premultiply(this.standingMatrix)
      this.matrixWorldNeedsUpdate = true
      this.visible = true

      //  Thumbpad and Buttons.

      //  X axis: -1 = Left, +1 = Right.
      //  Y axis: -1 = Bottom, +1 = Top.
      const [axis0, axis1] = gamepad.axes
      if (this.axes[0] !== axis0 || this.axes[1] !== axis1) {
        this.axes[0] = axis0
        this.axes[1] = axis1
        this.dispatchEvent({ type: 'axischange', axes: this.axes })
      }

      // { pressed: boolean, touched: boolean, value: number }
      Object.entries(BUTTON_MAP).forEach(([index, name]) => {
        if (this[`${name}IsPressed`] !== gamepad.buttons[index].pressed) {
          this[`${name}IsPressed`] = gamepad.buttons[index].pressed
          this.dispatchEvent({ type: this[`${name}IsPressed`] ? `${name}down` : `${name}up` })
        }
        if (this[`${name}Value`] !== gamepad.buttons[index].value) {
          this[`${name}Value`] = gamepad.buttons[index].value
          this.dispatchEvent({ type: `${name}change` })
        }
      })
    } else {
      this.visible = false
    }
  }

  // private

  _updateRaycaster () {
    // TODO: revisit methods of selection detection. Maybe cast a second ray in
    // the opposite direction?
    // TODO: set raycaster.far for control distance
    this._raycaster.ray.origin.copy(this.position)
    this.getWorldPosition(this._raycaster.ray.origin)
    this._raycaster.ray.direction.copy(new Vector3(0, 0, 1))
  }

  _handleDragStart () {
    // Intersected meshes are children of the Component, so we intersect
    // recursively and reference parent
    const intersects = this._raycaster.intersectObjects(this._objects, true)

    if (intersects.length > 0) {
      this._selected = intersects[0].object.parent

      this._offsetPosition.copy(this._selected.position)
      this.worldToLocal(this._offsetPosition)

      this._offsetQuaternion.copy(this.quaternion)
      this.getWorldQuaternion(this._offsetQuaternion)
      this._offsetQuaternion.inverse()
      this._offsetQuaternion.multiply(this._selected.quaternion)

      this.dispatchEvent({ type: 'dragstart', object: this._selected })
    }
  }

  _handleDragEnd () {
    if (this._selected) {
      this.dispatchEvent({ type: 'dragend', object: this._selected })
      this._selected = null
    }
  }

  _onSqueezeDown = () => {
    this._updateRaycaster()
    this._handleDragStart()
  }

  _onSqueezeUp = () => {
    this._handleDragEnd()
  }

  _onSqueezeChange = () => {
    const squeezeValue = Math.max(this.gamepad.buttons[1].value, this.gamepad.buttons[2].value)
    const scale = 1 - Math.min(squeezeValue / SQUEEZE_THRESHOLD, 1)
    this.ball.scale.set(scale, scale, scale)
    if (this.squeezeValue < SQUEEZE_THRESHOLD && squeezeValue >= SQUEEZE_THRESHOLD) {
      this._onSqueezeDown()
    } else if (this.squeezeValue > SQUEEZE_THRESHOLD && squeezeValue <= SQUEEZE_THRESHOLD) {
      this._onSqueezeUp()
    }
    this.squeezeValue = squeezeValue
  }

  _onPositionChange = () => {
    if (this._selected) {
      this._selected.position.copy(this._offsetPosition)
      this.localToWorld(this._selected.position)
      this.dispatchEvent({ type: 'drag', object: this._selected })
    }
  }

  _onQuaternionChange = (event) => {
    if (this._selected) {
      this._selected.quaternion.copy(event.quaternion)
      this.getWorldQuaternion(this._selected.quaternion)
      this._selected.quaternion.multiply(this._offsetQuaternion)
      this.dispatchEvent({ type: 'rotate', object: this._selected })
    }
  }
}

Object.assign(TouchControls.prototype, EventDispatcher.prototype)
