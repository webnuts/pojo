export default class ArgumentPicker {
  constructor(container) {
    this.container = container
  }

  getObject(dependencyName) {
    return this.container.getObject(dependencyName)
  }

  getAllObjects(dependencyName) {
    return this.container.getAllObjects(dependencyName)
  }

  config(key) {
    return this.container.getConfigValue(key)
  }
}