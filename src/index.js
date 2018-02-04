import App from './App'
import Assembly from './Assembly'
import example from './examples/bricks.json'

const parent = document.getElementById('container')
const app = new App(parent)
const assembly = Assembly.load(example)
app.load(assembly)
app.start()
