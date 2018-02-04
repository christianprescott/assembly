import App from './App'
import Assembly from './Assembly'

const parent = document.getElementById('container')
const app = new App(parent)
const assembly = Assembly.load()
app.load(assembly)
app.start()
