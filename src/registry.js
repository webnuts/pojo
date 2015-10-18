import Promise from 'bluebird'

export default class Registry {
  constructor(dependencies) {
    this.dependencies = dependencies || []
  }

  add(dependency) {
    if (dependency.name === 'container' || dependency.name === 'config') {
      throw new Error('"' + dependency.name + '" is reserved and already available as dependencies.')
    }
    this.dependencies.push(dependency)
  }

  addIfNotExists(dependency) {
    if (this.dependencies.some(dep => dep.name === dependency.name) === false) {
      this.add(dependency)
    }
  }

  remove(dependencyName) {
    let lastIndex = this.dependencies.length - 1
    for(let index = lastIndex; 0 <= index; index--) {
      if (this.dependencies[index].name === dependencyName) {
        this.dependencies.splice(index, 1)
      }
    }
  }

  try(dependencyName) {
    let matchingDependencies = this.getAll(dependencyName)
    if (1 < matchingDependencies.length) {
      throw new Error('Multiple dependencies exists with name "' + dependencyName + '".')
    }
    return matchingDependencies[0]
  }

  get(dependencyName) {
    let dependency = this.try(dependencyName)
    if (dependency === undefined) {
      throw new Error('No dependency exists with name "' + dependencyName + "'.")
    }
    return dependency
  }

  getAll(dependencyName) {
    if (dependencyName === undefined) {
      return this.dependencies.slice()
    } else {
      return this.dependencies.filter(dependency => dependency.name === dependencyName)
    }
  }

  disposeObjects() {
    let disposers = this.dependencies.map(dep => dep.getDisposer())
    return Promise.all(disposers).reduce((result, disposedObjects) => {
      return result.concat(disposedObjects)
    }, [])
  }

  clone() {
    return new Registry(this.dependencies.map(dep => dep.clone()))
  }
}
