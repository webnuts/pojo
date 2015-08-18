import Registry from './registry'
import Config from './config'
import NestedContainer from './nested-container'
import merge from 'merge'

export default class Container extends NestedContainer {
  constructor(registry, config) {
    super(registry, config)
  }

  createNestedContainer(configData) {
    let nestedDependencies = this.registry.dependencies.map(dep => {
      if (dep.lifecycle === 'singleton') {
        return dep
      } else if (dep.lifecycle === 'transient') {
        return dep.clone().asSingleton()
      } else {
        return dep.clone()
      }
    })

    let nestedConfigData = merge.recursive(true, this.config.data, configData || {})

    return new NestedContainer(new Registry(nestedDependencies), new Config(nestedConfigData))
  }
}
