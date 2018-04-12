// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/vr/ViveController.js

/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */

import {
  EventDispatcher,
  Matrix4,
  Object3D,
  Quaternion,
  Raycaster,
  Vector3,
} from 'three'

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
  triggerIsPressed = false
  gripsArePressed = false
  menuIsPressed = false

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
    this.activate()
  }

  activate () {
    this.addEventListener('triggerdown', this._onTriggerDown, false)
    this.addEventListener('triggerup', this._onTriggerUp, false)
    this.addEventListener('positionchange', this._onPositionChange, false)
    this.addEventListener('quaternionchange', this._onQuaternionChange, false)
  }

  // eslint-disable-next-line class-methods-use-this
  dispose () {
    // TODO: anything to do here? I believe it all happens on update
  }

  getGamepad () {
    return this.gamepad
  }

  getButtonState (button) {
    if (button === 'thumbpad') return this.thumbpadIsPressed
    if (button === 'trigger') return this.triggerIsPressed
    if (button === 'grips') return this.gripsArePressed
    if (button === 'menu') return this.menuIsPressed
    return false
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
        this.dispatchEvent({ type: 'axischanged', axes: this.axes })
      }

      if (this.thumbpadIsPressed !== gamepad.buttons[0].pressed) {
        this.thumbpadIsPressed = gamepad.buttons[0].pressed
        this.dispatchEvent({ type: this.thumbpadIsPressed ? 'thumbpaddown' : 'thumbpadup' })
      }

      if (this.triggerIsPressed !== gamepad.buttons[1].pressed) {
        this.triggerIsPressed = gamepad.buttons[1].pressed
        this.dispatchEvent({ type: this.triggerIsPressed ? 'triggerdown' : 'triggerup' })
      }

      if (this.gripsArePressed !== gamepad.buttons[2].pressed) {
        this.gripsArePressed = gamepad.buttons[2].pressed
        this.dispatchEvent({ type: this.gripsArePressed ? 'gripsdown' : 'gripsup' })
      }

      if (this.menuIsPressed !== gamepad.buttons[3].pressed) {
        this.menuIsPressed = gamepad.buttons[3].pressed
        this.dispatchEvent({ type: this.menuIsPressed ? 'menudown' : 'menuup' })
      }
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

  _onTriggerDown = () => {
    this._updateRaycaster()
    this._handleDragStart()
  }

  _onTriggerUp = () => {
    this._handleDragEnd()
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
