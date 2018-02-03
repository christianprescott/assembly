function component () {
  const element = document.createElement('div')
  element.innerText = 'Hello webpack'
  return element
}

document.body.appendChild(component())
