# Assembly

## Build

```sh
npm run build
open dist/index.html
```

## Configuration

`Assembly.load` accepts a configuration object to build the scene. The object
must have the following attributes. See src/examples for sample files.

### `obj: String`

Wavefront OBJ definition of geometry. Objects must be uniquely named. Objects
should be positioned so the Assembly is complete and each component is in the
desired position.

### `components: String[]`

Names of objects to be added to the scene as Components. Will be separated from
fixtures and have positions shuffled.

### `fixtures: String[]`

Names of objects to be added to the scene as Fixtures. Will maintain their
position in the scene and relative to other fixtures. Can not be repositioned.

### `links: String[][]`

Define placement of component relative to fixture or other component.
