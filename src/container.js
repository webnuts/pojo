import Registry from './registry'
import NestedContainer from './nested-container'
import merge from 'merge'
import Promise from 'bluebird'

export default class Container extends NestedContainer {
  constructor(registry, configData) {
    super(registry, configData)
  }

  createNestedContainer(configData, callback) {
    let container = this
    return Promise.try(() => {
      let nestedDependencies = container.registry.dependencies.map(dep => {
        if (dep.lifecycle === 'singleton') {
          return dep
        } else if (dep.lifecycle === 'transient') {
          return dep.clone().asSingleton()
        } else {
          return dep.clone()
        }
      })

      let nestedConfig = merge.recursive(true, container.config.data, configData || {})

      return new NestedContainer(new Registry(nestedDependencies), nestedConfig)
    }).nodeify(callback)
  }
}
