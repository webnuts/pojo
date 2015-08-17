import Config from './config'
import NestedContainer from './nested-container'

export default class Container extends NestedContainer {
  constructor(registry, config) {
    super(registry, config)
  }

  createNestedContainer(configData) {
    return new NestedContainer(this.registry.createdNestedRegistry(), this.config.createdNestedConfig(configData))
  }
}
