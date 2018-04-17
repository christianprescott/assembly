function create(containerId) {
  const container = document.getElementById(containerId)
  const app = new assembly.App(container)
  app.render()
  return app
}

function load(app, scene) {
  const objRequest = new XMLHttpRequest()
  objRequest.open('GET', `examples/${scene}.obj`)
  const configRequest = new XMLHttpRequest()
  configRequest.open('GET', `examples/${scene}.json`)
  configRequest.responseType = 'json'
  configRequest.onload = function () {
    app.load(assembly.Assembly.create(objRequest.response, configRequest.response))
    app.start()
  }
  objRequest.onload = function () {
    configRequest.send()
  }
  objRequest.send()
}
