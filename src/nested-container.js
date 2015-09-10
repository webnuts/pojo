import merge from 'merge'
import Registry from './registry'
import Config from './config'

export default class NestedContainer {
  constructor(registry, configData) {
    this.registry = registry
    this.config = new Config(configData)
  }

  try(nameOrFunction) {
    if (nameOrFunction === 'container') {
      return this
    }
    if (nameOrFunction === 'config') {
      return merge({}, this.config.data)
    }
    let dependency = this.registry.try(nameOrFunction)
    if (dependency) {
      return dependency.factory(this)
    }
  }

  get(nameOrFunction) {
    if (nameOrFunction === 'container') {
      return this
    }
    if (nameOrFunction === 'config') {
      return merge({}, this.config.data)
    }
    return this.registry.get(nameOrFunction).factory(this)
  }

  getAll(nameOrFunction) {
    if (nameOrFunction === 'container') {
      return [this]
    }
    if (nameOrFunction === 'config') {
      return [merge({}, this.config.data)]
    }
    return this.registry.getAll(nameOrFunction).map(dependency => dependency.factory(this))
  }
}
