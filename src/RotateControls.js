/* eslint-disable no-mixed-operators */

import {
  EventDispatcher,
  MOUSE,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'

const STATE = {
  NONE: -1,
  ROTATE: 0,
}
const UP = new Vector3(0, 0, 1)

export default class RotateControls {
  enabled = true
  mouseButton = MOUSE.LEFT
  rotateSpeed = 16.0

  //
  // internals
  //

  _raycaster = new Raycaster()

  _mouse = new Vector2()
  _right = new Vector3()

  _state = STATE.NONE
  _selected = null

  constructor (_objects, _camera, _domElement) {
    this._objects = _objects
    this._camera = _camera
    this._domElement = _domElement
    this.activate()
  }

  activate () {
    this._domElement.addEventListener('mousemove', this._onMouseMove, false)
    this._domElement.addEventListener('mousedown', this._onMouseDown, false)
    this._domElement.addEventListener('mouseup', this._onMouseUp, false)
    document.addEventListener('pointerlockchange', this._onPointerLockChange, false)
  }

  deactivate () {
    this._domElement.removeEventListener('mousemove', this._onMouseMove, false)
    this._domElement.removeEventListener('mousedown', this._onMouseDown, false)
    this._domElement.removeEventListener('mouseup', this._onMouseUp, false)
    document.removeEventListener('pointerlockchange', this._onPointerLockChange, false)
  }

  dispose () {
    this.deactivate()
  }

  //
  // private
  //

  _updateRaycaster (event) {
    const rect = this._domElement.getBoundingClientRect()

    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this._raycaster.setFromCamera(this._mouse, this._camera)
    // TODO: this math falls apart when camera nears vertical
    this._right.crossVectors(this._camera.getWorldDirection(), this._camera.up)
  }

  _handleDragStart () {
    // Intersected meshes are children of the Component, so we intersect
    // recursively and reference parent
    const intersects = this._raycaster.intersectObjects(this._objects, true)

    if (intersects.length > 0) {
      this._selected = intersects[0].object.parent
      this._state = STATE.ROTATE
      this.dispatchEvent({ type: 'rotatestart', object: this._selected })
      this._domElement.requestPointerLock()
    }
  }

  _handleDrag (event) {
    if (this._selected && this.enabled) {
      this._selected.rotateOnWorldAxis(
        UP,
        event.movementX / this._domElement.clientWidth * this.rotateSpeed,
      )
      this._selected.rotateOnWorldAxis(
        this._right,
        event.movementY / this._domElement.clientHeight * this.rotateSpeed,
      )

      this.dispatchEvent({ type: 'rotate', object: this._selected })
    }
  }

  _handleDragEnd () {
    if (this._selected) {
      this.dispatchEvent({ type: 'rotateend', object: this._selected })
      this._selected = null
    }

    this._state = STATE.NONE
  }

  _onMouseDown = (event) => {
    if (event.button !== this.mouseButton) return
    if (!event.ctrlKey) return
    event.preventDefault()

    this._updateRaycaster(event)
    this._handleDragStart()
  }

  _onMouseMove = (event) => {
    if (this._state === STATE.NONE) return
    event.preventDefault()

    this._handleDrag(event)
  }

  _onMouseUp = (event) => {
    if (this._state === STATE.NONE) return
    event.preventDefault()

    this._handleDragEnd()
    document.exitPointerLock()
  }

  _onPointerLockChange = () => {
    if (this._state === STATE.NONE) return
    if (document.pointerLockElement) return
    this._handleDragEnd()
  }
}

Object.assign(RotateControls.prototype, EventDispatcher.prototype)
