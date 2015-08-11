export default class Mixin {
  constructor(dependencyName) {
    this.dependencyName = dependencyName
  }

  extend(container, target) {
    let mixinObject = container.getObject(this.dependencyName)
    let propertiesObject = Object.getOwnPropertyNames(mixinObject).reduce((result, name) => {
      result[name] = Object.getOwnPropertyDescriptor(mixinObject, name)
      return result
    }, {})
    Object.defineProperties(target, propertiesObject)
  }

  validate(container, dependency) {
    if (container.checkDependencyExistence(this.dependencyName) === false) {
      throw new Error('Dependency "' + dependency.name + '" has mixin "' + this.dependencyName + '", but "' + this.dependencyName + '" is unknown. Please add it to the container.')
    }
  }
}