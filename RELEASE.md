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
- [ ] 3D input
    left click drag to move along camera plane
    shift+left click drag to move across camera plane
    ctrl+left click drag to rotate

## v0.5.0
- [ ] Target rotation
- [ ] Margin of error for target position and rotation
- [ ] Revisit scene units, camera clipping

## Backlog
- [ ] flow, see git stash https://flow.org/en/docs/getting-started/
- [ ] compound collisions
    configure many body meshes per obj mesh
    identify meshes as one of
      box - 8 vertices, right angles
      sphere - all vertices (max - min) distance from center of bounding box
- [ ] shuffle components
- [ ] more camera control
    WASD to translate
    snap to horizontal and vertical when released near those points
- [ ] fullscreen
- [ ] group linked components, additional grab handle appears for group
- [ ] physics, optional gravity
- [ ] constrain workspace, camera
- [ ] touch controls
- [ ] animation, indication for unplaced components
- [ ] component name tooltip
- [ ] toon outline
- [ ] materials, color
- [ ] Optional snap to position during drag or drag release
- [ ] "optional" links - accept one of several positions

## Notes

Tweak physics for quick resting http://www.html5gamedevs.com/topic/33392-whats-your-prefered-physics-engine-these-days/?tab=comments#comment-191804
Consider moving physics processing to worker https://github.com/schteppe/cannon.js/blob/master/examples/worker.html
Investigate normal-to-normal method of linking
Oimo.js https://github.com/lo-th/Oimo.js
Cannon.js https://github.com/schteppe/cannon.js
ammo.js https://github.com/kripken/ammo.js
GoblinPhysics https://github.com/chandlerprall/GoblinPhysics
