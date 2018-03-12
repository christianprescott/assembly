# Assembly

## Build

Set the `ASSEMBLY_DEBUG` environment variable to build in debug mode. Bodies are
rendered in wireframe and link distance is visible.

```sh
npm install
npm run build
cd dist && python -m SimpleHTTPServer 8080 # or whatever
open http://localhost:8080
```

## Scene Configuration

`Assembly.load` accepts two arguments to build the scene: the geometry
definition and a configuration object. See dist/examples for samples.

### `obj: String`

Wavefront OBJ definition of geometry. Objects must be uniquely named. Objects
should be positioned so the Assembly is complete and each component is in the
desired position.

Rigid bodies are determined from geometry bounding box.

### `config: Object`

The configuration defines relationships and roles of geometry, using the object
name as defined by `o [object name]` in the OBJ definition to reference
geometry. The object must have the following attributes.

#### `fixtures: String[]`

Names of objects to be added to the scene as Fixtures. Will maintain their
position in the scene and relative to other fixtures. Can not be repositioned.

Remaining objects will be added to the scene as Components.

#### `links: String[][]`

Define placement of component relative to fixture or other component. Each link
must be an array of two object names to link.
