import Registry from './registry'
import Config from './config'
import Promise from 'bluebird'
import deasync from 'deasync'

export default class NestedContainer {
  constructor(registry, configData) {
    this.registry = registry
    this.config = new Config(configData)
  }

  try(nameOrFunction, callback) {
    let container = this
    return Promise.try(() => {
      if (nameOrFunction === 'container') {
        return container
      }
      if (nameOrFunction === 'config') {
        return container.config
      }
      let dependency = container.registry.try(nameOrFunction)
      if (dependency) {
        return dependency.factory(container)
      }
    }).nodeify(callback)
  }

  get(nameOrFunction, callback) {
    let container = this
    return Promise.try(() => {
      if (nameOrFunction === 'container') {
        return container
      }
      if (nameOrFunction === 'config') {
        return container.config
      }
      return container.registry.get(nameOrFunction).factory(container)
    }).nodeify(callback)
  }

  getAll(nameOrFunction, callback) {
    let container = this
    return Promise.try(() => {
      if (nameOrFunction === 'container') {
        return [container]
      }
      if (nameOrFunction === 'config') {
        return [container.config]
      }
      return Promise.all(container.registry.getAll(nameOrFunction).map(dependency => dependency.factory(container)))
    }).nodeify(callback)
  }
}

NestedContainer.prototype.trySync = deasync(NestedContainer.prototype.try)
NestedContainer.prototype.getSync = deasync(NestedContainer.prototype.get)
NestedContainer.prototype.getAllSync = deasync(NestedContainer.prototype.getAll)
