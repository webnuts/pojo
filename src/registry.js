export default class Registry {
  constructor(dependencies) {
    this.dependencies = dependencies || []
  }

  getDependencyName(nameOrFunction) {
    switch(typeof(nameOrFunction)) {
      case 'function': {
        return nameOrFunction.name
      }
      case 'string': {
        return nameOrFunction
      }
      default: {
        return undefined
      }
    }
  }

  add(dependency) {
    this.dependencies.push(dependency)
  }

  addIfNotExists(dependency) {
    if (this.dependencies.some(dep => dep.name === dependency.name) === false) {
      this.add(dependency)
    }
  }

  replace(dependency) {
    this.remove(dependency)
    this.add(dependency)
  }

  remove(nameOrDependency) {
    let dependencyName = typeof(nameOrDependency) === 'string' ? nameOrDependency : nameOrDependency.name
    let lastIndex = this.dependencies.length - 1
    for(let index = lastIndex; 0 <= index; index--) {
      if (this.dependencies[index].name === dependencyName) {
        this.dependencies.splice(index, 1)
      }
    }
  }

  get(nameOrFunction) {
    let dependencyName = this.getDependencyName(nameOrFunction)
    let matchingDependencies = this.getAll(dependencyName)
    if (1 < matchingDependencies.length) {
      throw new Error('Multiple dependencies exists with name "' + dependencyName + '".')
    } else if (matchingDependencies.length === 0) {
      throw new Error('No dependency exists with name "' + dependencyName + "'.")
    } else {
      return matchingDependencies[0]
    }
  }

  getAll(nameOrFunction) {
    let dependencyName = this.getDependencyName(nameOrFunction)
    if (dependencyName === undefined) {
      return this.dependencies.slice()
    } else {
      return this.dependencies.filter(dependency => dependency.name === dependencyName)
    }
  }

  clone() {
    return new Registry(this.dependencies.map(dep => dep.clone()))
  }

  createdNestedRegistry() {
    let nestedDependencies = this.dependencies.map(dep => {
      if (dep.lifecycle === 'singleton') {
        return dep
      } else if (dep.lifecycle === 'transient') {
        return dep.clone().asSingleton()
      } else {
        return dep.clone()
      }
    })
    return new Registry(nestedDependencies)
  }
}
