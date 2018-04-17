# Assembly

Assembly is a small engine for positioning pieces of something in 3D space. It
allows you to specify the "components" involved and the links between them, then
renders the scene in the element of your choice. Controls are available for
mouse and keyboard, touch, and WebVR.

TODO: one *glaring* omission right now - components are not shuffled from their
original correct positions.

To use Assembly in your app first `npm install assembly-app` then

```
import { App, Assembly } from 'assembly-app'
const app = new App(domElement)
app.load(Assembly.create(obj, config))
app.start()
```

See [Scene Configuration](#scene-configuration) for more on `Assembly.create`.

## Build

Set the `ASSEMBLY_DEBUG` environment variable to build in debug mode. Bodies are
rendered in wireframe and link distance is visible.

```sh
npm install
npx webpack
python -m SimpleHTTPServer 8080 # or whatever
open http://localhost:8080/docs/dev.html
```

## Test

```sh
npm run test
open http://localhost:9876
```

## Scene Configuration

`Assembly.create(obj, config)` accepts two arguments to build the scene: the
geometry definition and a sidecar configuration object. See dist/examples for
samples.

### `obj: String`

Wavefront OBJ definition of geometry. Objects must be uniquely named. Objects
should be positioned so the assembly is complete and each component is in the
desired position.

Define geometry for both the rendered scene and physics rigid bodies, the
configuration object will define each object's role.

Geometry units are meters and scale is important for convincing VR experience.
Objects are rendered Z up and Y forward. In hindsight this is nonstandard and
was a poor decision.

### `config: Object`

The configuration defines relationships and roles of geometry, using the object
name as defined by `o [object name]` in the OBJ definition to reference
geometry. The object must have the following attributes.

#### `components: Object`

Components are repositioned by the user to complete the assembly.

The keys of the `components` object are the names referenced by `links`. The
values of the `components` object must be objects with the following attributes.

##### `meshes: String[]`

Names of geometry objects that will be rendered in the scene to represent this
component. Unless also included in `bodies`, these objects will have no effect
on collisions between components and fixtures.

##### `bodies: String[]`

Names of geometry objects that will be added to the physics world as rigid
bodies. These objects are not rendered.

Rigid body geometry must be a box. If the box shape cannot be determined,
geometry bounding box is used.

#### `fixtures: Object`

Fixtures are static. They can be linked to components but cannot be
repositioned.

The `fixtures` object must take the same shape as `components`.

#### `links: String[][]`

Define placement of component relative to fixture or other component. Each link
must be an array of two object names defined by the keys of `components` or
`fixtures`.
