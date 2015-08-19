import Registry from './registry'
import Container from './container'
import Dependency from './dependency'

export default class Pojo {
  constructor() {
    this.registry = new Registry()
  }

  createContainer(config) {
    return new Container(this.registry.clone(), config || {})
  }

  add() {
    let dependency = Dependency.parse.apply(null, arguments)
    this.registry.add(dependency)
    return this
  }

  addIfNotExists() {
    let dependency = Dependency.parse.apply(null, arguments)
    this.registry.addIfNotExists(dependency)
    return this
  }

  addSingleton() {
    let dependency = Dependency.parse.apply(null, arguments).asSingleton()
    this.registry.add(dependency)
    return this
  }

  addSingletonIfNotExists() {
    let dependency = Dependency.parse.apply(null, arguments).asSingleton()
    this.registry.addIfNotExists(dependency)
    return this
  }

  addTransient() {
    let dependency = Dependency.parse.apply(null, arguments).asTransient()
    this.registry.add(dependency)
    return this
  }

  addTransientIfNotExists() {
    let dependency = Dependency.parse.apply(null, arguments).asTransient()
    this.registry.addIfNotExists(dependency)
    return this
  }

  replace() {
    let dependency = Dependency.parse.apply(null, arguments).asSingleton()
    this.registry.replace(dependency)
    return this
  }

  remove(dependencyName) {
    this.registry.remove(dependencyName)
    return this
  }
}
