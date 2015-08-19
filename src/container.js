import Registry from './registry'
import NestedContainer from './nested-container'
import merge from 'merge'

export default class Container extends NestedContainer {
  constructor(registry, config) {
    super(registry, config)
  }

  createNestedContainer(config) {
    let nestedDependencies = this.registry.dependencies.map(dep => {
      if (dep.lifecycle === 'singleton') {
        return dep
      } else if (dep.lifecycle === 'transient') {
        return dep.clone().asSingleton()
      } else {
        return dep.clone()
      }
    })

    let nestedConfig = merge.recursive(true, this.config, config || {})

    return new NestedContainer(new Registry(nestedDependencies), nestedConfig)
  }
}
