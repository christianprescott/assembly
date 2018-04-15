# Release Notes

## v0.1.0
- [x] Fixed camera
- [x] Fixed object
- [x] Drag and drop object
- [x] Recognize distance to target

## v0.2.0
- [x] renderer responsive to container or window
- [x] "assembly" defining fixtures, components, and targets
- [x] "fixtures" locked in place
- [x] Target relative to previous fixtures and components

## v0.3.0
- [x] Extract Assembly scene
- [x] Serializable assembly format
- [x] Basic lighting, toon materials

## v0.4.0
- [x] physics, drag collisions
- [x] camera control
    right click drag to orbit
    camera stays z-up
- [x] 3D input
    left click drag to move along camera plane
    shift+left click drag to move across camera plane
    ctrl+left click drag to rotate
- [x] fullscreen

## v0.5.0
- [x] shadows
- [x] debug view
- [x] Target rotation

## v0.6.0
- [x] compound collisions
    configure many body meshes per obj mesh
- [x] body shapes, box, 8 vertices at right angles

## v0.7.0
- [x] VR, display
- [x] VR, controls
- [x] Revisit scene units, camera clipping
    consider shadowmap and light position
- [x] floor plane

## v0.8.0
- [x] event emitter
- [x] camera position and orbit at assembly bounds and center

## Backlog
- [ ] shuffle components
- [ ] group linked components, additional grab handle appears for group
- [ ] body shapes, sphere, all vertices (max - min) distance from center of bounding box
- [ ] body shapes, cylinder
- [ ] controls, refine dragging
- [ ] materials, color
- [ ] physics, optional gravity
- [ ] constrain workspace, camera
- [ ] Margin of error for target position and rotation
- [ ] more camera control
    WASD to translate
    snap to horizontal and vertical when released near those points
- [ ] touch controls
- [ ] animation, indication for unplaced components
- [ ] component name tooltip
- [ ] toon outline
- [ ] Optional snap to position during drag or drag release
- [ ] "optional" links - accept one of several positions

## Notes

Ensure THREE objects are instantiated only once, then copied or set during manipulation
Tweak physics for quick resting http://www.html5gamedevs.com/topic/33392-whats-your-prefered-physics-engine-these-days/?tab=comments#comment-191804
Consider moving physics processing to worker https://github.com/schteppe/cannon.js/blob/master/examples/worker.html
Investigate normal-to-normal method of linking
Oimo.js https://github.com/lo-th/Oimo.js
Cannon.js https://github.com/schteppe/cannon.js
ammo.js https://github.com/kripken/ammo.js
GoblinPhysics https://github.com/chandlerprall/GoblinPhysics
