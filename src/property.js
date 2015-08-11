export default class Property {
  constructor(name, dependencyName) {
    this.name = name
    this.dependencyName = dependencyName
  }

  setProperty(container, target) {
    target[this.name] = container.getObject(this.dependencyName)
  }

  validate(container, dependency) {
    if (container.checkDependencyExistence(this.dependencyName) === false) {
      throw new Error('Dependency "' + dependency.name + '" has property "' + this.name + '" set to "' + this.dependencyName + '", but "' + this.dependencyName + '" is unknown. Please add it to the container.')
    }
  }
}