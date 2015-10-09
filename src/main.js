import Registry from './registry'
import Container from './container'
import Dependency from './dependency'

export default class Pojo {
  constructor() {
    this.registry = new Registry()
  }

  createContainer(configData) {
    return new Container(this.registry.clone(), configData || {})
  }

  add(dependencyName, factoryCandidate, disposer) {
    let dependency = Dependency.parse(dependencyName, factoryCandidate, disposer, 'unique')
    this.registry.add(dependency)
    return this
  }

  addIfNotExists(dependencyName, factoryCandidate, disposer) {
    let dependency = Dependency.parse(dependencyName, factoryCandidate, disposer, 'unique')
    this.registry.addIfNotExists(dependency)
    return this
  }

  addSingleton(dependencyName, factoryCandidate, disposer) {
    let dependency = Dependency.parse(dependencyName, factoryCandidate, disposer, 'singleton')
    this.registry.add(dependency)
    return this
  }

  addSingletonIfNotExists(dependencyName, factoryCandidate, disposer) {
    let dependency = Dependency.parse(dependencyName, factoryCandidate, disposer, 'singleton')
    this.registry.addIfNotExists(dependency)
    return this
  }

  addTransient(dependencyName, factoryCandidate, disposer) {
    let dependency = Dependency.parse(dependencyName, factoryCandidate, disposer, 'transient')
    this.registry.add(dependency)
    return this
  }

  addTransientIfNotExists(dependencyName, factoryCandidate, disposer) {
    let dependency = Dependency.parse(dependencyName, factoryCandidate, disposer, 'transient')
    this.registry.addIfNotExists(dependency)
    return this
  }

  remove(dependencyName) {
    this.registry.remove(dependencyName)
    return this
  }
}
