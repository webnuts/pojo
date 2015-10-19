import Registry from './registry'
import Config from './config'
import Promise from 'bluebird'
import deasync from 'deasync'

export default class NestedContainer {
  constructor(registry, configData) {
    this.registry = registry
    this.config = new Config(configData)
  }

  try(...dependencyNames) {
    let callback = undefined
    if (typeof(dependencyNames[dependencyNames.length-1]) === 'function') {
      callback = dependencyNames.pop()
    }
    let container = this
    return Promise.all(dependencyNames.map(dependencyName => {
      if (dependencyName === 'container') {
        return container
      }
      if (dependencyName === 'config') {
        return container.config
      }
      let dependency = container.registry.try(dependencyName)
      if (dependency) {
        return dependency.factory(container)
      }
    })).then(dependencyObjects => {
      if (dependencyNames.length === 1) {
        return dependencyObjects[0]
      }
      return dependencyObjects
    }).nodeify(callback)
  }

  get(...dependencyNames) {
    let callback = undefined
    if (typeof(dependencyNames[dependencyNames.length-1]) === 'function') {
      callback = dependencyNames.pop()
    }
    let container = this
    return Promise.all(dependencyNames.map(dependencyName => {
      if (dependencyName === 'container') {
        return container
      }
      if (dependencyName === 'config') {
        return container.config
      }
      return container.registry.get(dependencyName).factory(container)
    })).then(dependencyObjects => {
      if (dependencyNames.length === 1) {
        return dependencyObjects[0]
      }
      return dependencyObjects
    }).nodeify(callback)
  }

  getAll(...dependencyNames) {
    let callback = undefined
    if (typeof(dependencyNames[dependencyNames.length-1]) === 'function') {
      callback = dependencyNames.pop()
    }

    let container = this
    return Promise.all(dependencyNames.map(dependencyName => {
      if (dependencyName === 'container') {
        return [container]
      }
      if (dependencyName === 'config') {
        return [container.config]
      }
      return Promise.all(container.registry.getAll(dependencyName).map(dependency => dependency.factory(container)))
    })).then(dependencyObjects => {
      if (dependencyNames.length === 1) {
        return dependencyObjects[0]
      }
      return dependencyObjects
    }).nodeify(callback)
  }

  dispose() {
    return this.registry.disposeObjects()
  }
}

NestedContainer.prototype.trySync = deasync(NestedContainer.prototype.try)
NestedContainer.prototype.getSync = deasync(NestedContainer.prototype.get)
NestedContainer.prototype.getAllSync = deasync(NestedContainer.prototype.getAll)
