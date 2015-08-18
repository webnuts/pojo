import Registry from './registry'
import Config from './config'

export default class NestedContainer {
  constructor(registry, config) {
    this.registry = registry
    this.config = config
  }

  get(nameOrFunction) {
    if (nameOrFunction === 'container') {
      return this
    }
    if (nameOrFunction === 'config') {
      return this.config
    }
    return this.registry.get(nameOrFunction).factory(this)
  }

  getAll(nameOrFunction) {
    if (nameOrFunction === 'container') {
      return [this]
    }
    if (nameOrFunction === 'config') {
      return [this.config]
    }
    return this.registry.getAll(nameOrFunction).map(dependency => dependency.factory(this))
  }
}
