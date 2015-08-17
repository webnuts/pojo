export default class NestedContainer {
  constructor(registry, config) {
    registry.setContainer(this)
    this.registry = registry
    this.config = config
  }

  get(nameOrFunction) {
    return this.registry.get(nameOrFunction).factory(this)
  }

  getAll(nameOrFunction) {
    return this.registry.getAll(nameOrFunction).map(dependency => dependency.factory(this))
  }
}
