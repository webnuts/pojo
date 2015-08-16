export default class Container {
  constructor(registry, config, parent) {
    registry.setContainer(this)
    this.registry = registry
    this.config = config
    this.parent = parent
  }

  get(nameOrFunction) {
    return this.registry.get(nameOrFunction).factory(this)
  }

  getAll(nameOrFunction) {
    return this.registry.getAll(nameOrFunction).map(dependency => dependency.factory(this))
  }

  createNestedContainer(configData) {
    let parent = this.parent || this
    return new Container(parent.registry.createdNestedRegistry(), this.config.createdNestedConfig(configData || {}), parent)
  }
}
