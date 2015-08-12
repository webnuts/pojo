import merge from 'merge'
import Dependency from './dependency'

export default class Container {
  constructor(config, parent) {
    this.config = config || {}
    this.parent = parent
    this.childContainers = []
    this.dependencies = []
  }

  getObject(dependencyName) {
    let matchingDependencies = this.getDependencies(dependencyName)
    if (1 < matchingDependencies.length) {
      throw new Error('Multiple dependencies exists with name "' + dependencyName + '". Use function getAllObjects(dependencyName) to retrieve multiple objects.')
    } else if (matchingDependencies.length === 0) {
      throw new Error('No dependency exist with name "' + dependencyName + "'.")
    } else {
      return matchingDependencies[0].factory(this)
    }
  }

  getAllObjects(dependencyName) {
    return this.getDependencies(dependencyName).map(dependency => dependency.factory(this))
  }

  checkDependencyExistence(dependencyName) {
    return 0 < this.getDependencies(dependencyName).length
  }

  getDependencies(dependencyName) {
    let matchingDependencies = this.dependencies.filter(dependency => dependency.name === dependencyName)
    if (this.parent) {
      matchingDependencies = matchingDependencies.concat(this.parent.getSingletonDependencies(dependencyName))
    }
    return matchingDependencies
  }

  getSingletonDependencies(dependencyName) {
    let singletonDependencies = this.dependencies.filter(dependency => dependency.name === dependencyName && dependency.scope === 'singleton')
    if (this.parent) {
      Array.prototype.push(singletonDependencies, this.parent.getSingletonDependencies(dependencyName))
    }
    return singletonDependencies
  }

  createChild(config) {
    let container = new Container(config, this)
    this.childContainers.push(container)
    return container
  }

  addConfig(config) {
    merge.recursive(this.config, config)
    return this
  }

  getConfigValue(key) {
    let value = this.config[key]
    if (value === undefined && this.parent) {
      value = this.parent.getConfigValue(key)
    }
    return value
  }

  addDependency(factoryCandidate, options) {
    let dependency = new Dependency(factoryCandidate, options)
    this.dependencies.push(dependency)
    return dependency
  }

  addDependencyIfNotExists(factoryCandidate, options) {
    let dependency = new Dependency(factoryCandidate, options)
    if (this.dependencies.some(dep => dep.name === dependency.name) === false) {
      this.dependencies.push(dependency)
    }
    return dependency
  }

  removeDependency(dependencyName) {
    let lastIndex = this.dependencies.length - 1
    for(let index = lastIndex; 0 <= index; index--) {
      if (this.dependencies[index].name === dependencyName) {
        this.dependencies.splice(index, 1)
      }
    }
    return this
  }

  validate() {
    this.dependencies.forEach(dependency => dependency.validate(this))
  }
}
