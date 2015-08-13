import Registry from './registry'
import Container from './container'
import Config from './config'
import Dependency from './dependency'

export default class Pojo {
  constructor() {
    this.registry = new Registry()
  }

  createContainer(configData) {
    return new Container(this.registry.clone(), new Config(configData))
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