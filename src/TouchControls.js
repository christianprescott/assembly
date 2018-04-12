// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/vr/ViveController.js

/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */

import { EventDispatcher, Matrix4, Object3D } from 'three'

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

  gamepad = null

  axes = [0, 0]
  thumbpadIsPressed = false
  triggerIsPressed = false
  gripsArePressed = false
  menuIsPressed = false

  constructor (id) {
    super()
    this.gamepadId = id
    this.matrixAutoUpdate = false
    this.standingMatrix = new Matrix4()
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

      if (pose.position !== null) this.position.fromArray(pose.position)
      if (pose.orientation !== null) this.quaternion.fromArray(pose.orientation)
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
}

Object.assign(TouchControls.prototype, EventDispatcher.prototype)
