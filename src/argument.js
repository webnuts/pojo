export default class Argument {
  constructor(dependencyName) {
    this.dependencyName = dependencyName
  }

  getObject(container) {
    return container.getObject(this.dependencyName)
  }

  validate(container, dependency) {
    if (container.checkDependencyExistence(this.dependencyName) === false) {
      throw new Error('Dependency "' + dependency.name + '" has argument "' + this.dependencyName + '", but "' + this.dependencyName + '" is unknown. Please add it to the container.')
    }
  }
}