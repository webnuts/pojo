export default class Decorator {
  constructor(dependencyName) {
    this.dependencyName = dependencyName
  }

  decorate(container, target) {
    let decorator = container.getObject(this.dependencyName)
    decorator.decorate(target)
  }

  validate(container, dependency) {
    if (container.checkDependencyExistence(this.dependencyName) === false) {
      throw new Error('Dependency "' + dependency.name + '" has decorator "' + this.dependencyName + '", but "' + this.dependencyName + '" is unknown. Please add it to the container.')
    }
  }
}