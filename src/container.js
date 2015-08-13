export default class Container {
  constructor(registry, config) {
    this.registry = registry
    this.config = config
  }

  get(nameOrFunction) {
    return this.registry.get(nameOrFunction).factory(this)
  }

  getAll(nameOrFunction) {
    return this.registry.getAll(nameOrFunction).map(dependency => dependency.factory(this))
  }

  createNestedContainer(configData) {
    return new Container(this.registry, this.config.createdNestedConfig(configData || {}))
  }
}
