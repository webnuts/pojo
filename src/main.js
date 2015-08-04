export default class PojoFabric {
  constructor() {
    this.services = {}
    this.disposableObjects = []
  }

  add(name, factory, options) {
    options = options || {scope: 'prototype'}
    let container = this
    let dependencyFactory = container.services[name] = {scope: (options.scope || 'prototype')}
    
    dependencyFactory.factory = function() {
      if (dependencyFactory.scope === 'singleton' && dependencyFactory.singleton !== undefined) {
        return dependencyFactory.singleton
      }

      let service = null

      if (factory.name.length === 0) {
        service = factory.apply(null, arguments)
      } else {
        service = Object.create(factory.prototype)
        factory.apply(service, arguments)
      }

      container.populate(service)

      if (typeof(service.dispose) === 'function') {
        container.disposableObjects.push(service)
      }

      if (scope === 'singleton') {
        dependencyFactory.singleton = service
      }
      return service
    }
  }

  populate(service) {
    Object.keys(service).forEach(propertyName => {
      if (service[propertyName] === undefined) {
        let {factory} = this.services[propertyName] || {}
        if (factory) {
          service[propertyName] = factory()
        }
      }
    })

    return service
  }

  create(name, ...args) {
    let {factory} = this.services[name] || {}
    return factory.apply(null, args)
  }

  dispose() {
    this.disposableObjects.forEach(disposableObject => disposableObject.dispose())
  }
}
