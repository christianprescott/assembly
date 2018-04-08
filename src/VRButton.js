// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/vr/WebVR.js

/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Based on @tojiro's vr-samples-utils.js
 */

import { EventDispatcher } from 'three'

function _createElement () {
  const button = document.createElement('button')
  button.textContent = 'OMG'
  button.style.position = 'absolute'
  button.style.bottom = '20px'
  button.style.right = '20px'
  button.style.padding = '12px 6px'
  button.style.border = '1px solid #fff'
  button.style.borderRadius = '4px'
  button.style.background = 'transparent'
  button.style.color = '#fff'
  button.style.font = 'normal 13px sans-serif'
  button.style.opacity = '0.5'
  button.style.outline = 'none'
  return button
}

export default class VRButton {
  renderer = null

  constructor (parent, renderer) {
    if ('getVRDisplays' in navigator) {
      this.button = _createElement()
      parent.appendChild(this.button)

      window.addEventListener('vrdisplayconnect', this._vrDisplayConnect, false)
      window.addEventListener('vrdisplaydisconnect', this._vrDisplayDisconnect, false)
      window.addEventListener('vrdisplaypresentchange', this._vrDisplayPresentChange, false)
      window.addEventListener('vrdisplayactivate', this._vrDisplayActivate, false)

      navigator.getVRDisplays().then((displays) => {
        if (displays.length > 0) {
          this._showEnterVR(displays[0])
        } else {
          this._showVRNotFound()
        }
      })
    }

    this.renderer = renderer
  }

  // TODO: implement dispose

  _vrDisplayConnect = (event) => {
    this._showEnterVR(event.display)
  }

  _vrDisplayDisconnect = () => {
    this._showVRNotFound()
  }

  _vrDisplayPresentChange = (event) => {
    this.button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR'
  }

  _vrDisplayActivate = (event) => {
    this._requestPresent(event.display)
  }

  _exitPresent = (display) => {
    display.exitPresent()
    this.renderer.vr.enabled = false
    this.dispatchEvent({ type: 'exit', object: display })
    this.renderer.vr.setDevice(null)
  }

  _requestPresent = (display) => {
    this.dispatchEvent({ type: 'enter', object: display })
    this.renderer.vr.enabled = true
    display.requestPresent([{ source: this.renderer.domElement }])
    this.renderer.vr.setDevice(display)
  }

  _showEnterVR (display) {
    this.button.style.cursor = 'pointer'
    this.button.textContent = 'ENTER VR'
    this.button.onmouseenter = () => { this.button.style.opacity = '1.0' }
    this.button.onmouseleave = () => { this.button.style.opacity = '0.5' }
    this.button.onclick = () => {
      if (display.isPresenting) {
        this._exitPresent(display)
      } else {
        this._requestPresent(display)
      }
    }
  }

  _showVRNotFound () {
    this.button.style.cursor = 'auto'
    this.button.textContent = 'VR NOT FOUND'
    this.button.onmouseenter = null
    this.button.onmouseleave = null
    this.button.onclick = null
  }
}

Object.assign(VRButton.prototype, EventDispatcher.prototype)
