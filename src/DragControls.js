/* eslint-disable no-mixed-operators */

// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/controls/DragControls.js

/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */

import {
  Camera,
  EventDispatcher,
  MOUSE,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'

export default class DragControls {
  enabled = true
  mouseButton = MOUSE.LEFT

  //
  // internals
  //

  _plane = new Plane()
  _raycaster = new Raycaster()

  _mouse = new Vector2()
  _offset = new Vector3()
  _intersection = new Vector3()

  _selected = null
  _hovered = null

  constructor (_objects, _camera, _domElement) {
    if (_objects instanceof Camera) {
      throw new Error('THREE.DragControls: Constructor now expects ( objects, camera, domElement )')
    }

    this._objects = _objects
    this._camera = _camera
    this._domElement = _domElement
    this.activate()
  }

  activate () {
    this._domElement.addEventListener('mousemove', this._onDocumentMouseMove, false)
    this._domElement.addEventListener('mousedown', this._onDocumentMouseDown, false)
    this._domElement.addEventListener('mouseup', this._onDocumentMouseCancel, false)
    this._domElement.addEventListener('mouseleave', this._onDocumentMouseCancel, false)
    this._domElement.addEventListener('touchmove', this._onDocumentTouchMove, false)
    this._domElement.addEventListener('touchstart', this._onDocumentTouchStart, false)
    this._domElement.addEventListener('touchend', this._onDocumentTouchEnd, false)
  }

  deactivate () {
    this._domElement.removeEventListener('mousemove', this._onDocumentMouseMove, false)
    this._domElement.removeEventListener('mousedown', this._onDocumentMouseDown, false)
    this._domElement.removeEventListener('mouseup', this._onDocumentMouseCancel, false)
    this._domElement.removeEventListener('mouseleave', this._onDocumentMouseCancel, false)
    this._domElement.removeEventListener('touchmove', this._onDocumentTouchMove, false)
    this._domElement.removeEventListener('touchstart', this._onDocumentTouchStart, false)
    this._domElement.removeEventListener('touchend', this._onDocumentTouchEnd, false)
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
  }

  _handleDragStart () {
    const intersects = this._raycaster.intersectObjects(this._objects)

    if (intersects.length > 0) {
      this._selected = intersects[0].object

      this._plane.setFromNormalAndCoplanarPoint(
        this._camera.getWorldDirection(this._plane.normal),
        this._selected.position,
      )

      if (this._raycaster.ray.intersectPlane(this._plane, this._intersection)) {
        this._offset.copy(this._intersection).sub(this._selected.position)
      }

      this._domElement.style.cursor = 'move'

      this.dispatchEvent({ type: 'dragstart', object: this._selected })
    }
  }

  _handleDrag () {
    if (this._selected && this.enabled) {
      if (this._raycaster.ray.intersectPlane(this._plane, this._intersection)) {
        this._selected.position.copy(this._intersection.sub(this._offset))
      }

      this.dispatchEvent({ type: 'drag', object: this._selected })
    }
  }

  _handleDragEnd () {
    if (this._selected) {
      this.dispatchEvent({ type: 'dragend', object: this._selected })
      this._selected = null
    }

    this._domElement.style.cursor = 'auto'
  }

  _onDocumentMouseMove = (event) => {
    event.preventDefault()

    this._updateRaycaster(event)

    if (this._selected && this.enabled) {
      this._handleDrag(event)
      return
    }

    const intersects = this._raycaster.intersectObjects(this._objects)

    if (intersects.length > 0) {
      const { object } = intersects[0]

      if (this._hovered !== object) {
        this.dispatchEvent({ type: 'hoveron', object })

        this._domElement.style.cursor = 'pointer'
        this._hovered = object
      }
    } else if (this._hovered !== null) {
      this.dispatchEvent({ type: 'hoveroff', object: this._hovered })

      this._domElement.style.cursor = 'auto'
      this._hovered = null
    }
  }

  _onDocumentMouseDown = (event) => {
    if (event.button !== this.mouseButton) return
    event.preventDefault()

    this._updateRaycaster(event)
    this._handleDragStart()
  }

  _onDocumentMouseCancel = (event) => {
    event.preventDefault()
    this._handleDragEnd()
  }

  _onDocumentTouchMove = (e) => {
    e.preventDefault()
    const [event] = e.touches

    this._updateRaycaster(event)
    this._handleDrag(event)
  }

  _onDocumentTouchStart = (e) => {
    e.preventDefault()
    if (e.touches.length !== 1) {
      this._handleDragEnd()
      return
    }
    const [event] = e.touches

    this._updateRaycaster(event)
    this._handleDragStart()
  }

  _onDocumentTouchEnd = (event) => {
    event.preventDefault()
    this._handleDragEnd()
  }
}

Object.assign(DragControls.prototype, EventDispatcher.prototype)
