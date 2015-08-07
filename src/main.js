import merge from 'merge'

let throwNoDependencyExist = (name) => { throw new Error('No dependency exist with name "' + mixinName + "'.") }
let throwMultipleDependenciesExists = (name) => { throw new Error('Multiple dependencies exist with name "' + name + '". Use function getAllObjects(dependencyName) to retrieve multiple objects.') }
let throwInvalidScope = (name) => { throw new Error('Invalid scope: ' + name) }
let throwInvalidFactoryOrObject = () => { throw new Error('A dependency must be a function or an object.') }
let throwDependencyWithoutName = () => { throw new Error('Cannot add a dependency without a name. Use a named function (class) or use option {name: "SomeName"}.') }
let throwInvalidMixinType = () => { throw new Error('Invalid mixin type: ' + mixinType) }
let throwIsDisposed = () => { throw new Error('The Pojo object has been disposed. Create a new Pojo object.') }

export default class Pojo {
  constructor(config, parent) {
    this.config = config || {}
    this.parent = parent
    this.childContainers = []
    this.dependencies = []
    this.disposableObjects = []
    this.isDisposed = false
  }

  getObject(dependencyName) {
    return this.getDependency(dependencyName).factory()
  }

  getAllObjects(dependencyName) {
    return this.getDependencies(dependencyName).map(dependency => dependency.factory())
  }

  getDependency(name, returnEmptyDependency) {
    let matchingDependencies = this.getDependencies(dependencyName)
    if (matchingDependencies.length === 0) {
      if (returnEmptyDependency) {
        return {factory: () => undefined}
      } else {
        throwNoDependencyExist(dependencyName)
      }
    } else if (1 < matchingDependencies.length) {
      throwMultipleDependenciesExists(dependencyName)
    } else {
      return matchingDependencies[0]
    }
  }

  getDependencies(name) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    if (name === undefined) {
      return this.dependencies.slice(0)
    } else {
      return this.dependencies.filter(dependency => dependency.name === name)
    }
  }

  createChild(config) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    let container = new Pojo(config, this)
    this.childContainers.push(container)
    return container
  }

  addConfig(config) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    merge.recursive(this.config, config)
    return this
  }

  getConfigValue(key) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    return this.config[key] || this.parent == null ? undefined : this.parent.getConfigValue(key)
  }

  removeDependencies(name) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    for(let index = this.dependencies.length - 1; index--; ) {
      if (this.dependencies[index].name === name) {
        this.dependencies.splice(index, 1)
      }
    }
  }

  addDependency(constructorOrFactoryOrObject, options) {
    if (this.isDisposed) {
      throwIsDisposed()
    }

    let dependency = merge.recursive({scope: 'prototype', mixins: []}, options || {})

    if (['singleton', 'prototype'].indexOf(dependency.scope) === -1) {
      throwInvalidScope(dependency.scope)
    }

    let baseFactory = null
    switch(typeof(constructorOrFactoryOrObject || 'ignoreNull')) {
      case 'function': {
        if (constructorOrFactoryOrObject.name.length === 0) {
          baseFactory = () => constructorOrFactoryOrObject()
        } else {
          if (dependency.name == null) {
            dependency.name = constructorOrFactoryOrObject.name
          } 
          baseFactory = () => new constructorOrFactoryOrObject()
        }
        break
      }
      case 'object': {
        baseFactory = () => merge({}, constructorOrFactoryOrObject) // clone
        break
      }
      default: {
        throwInvalidFactoryOrObject()
      }
    }

    if (dependency.name == null || dependency.name.length === 0) {
      throwDependencyWithoutName()
    }

    dependency.factory = (() => {
      let target = baseFactory()
      this.populateProperties(target)
          .populateConfigProperty(target, dependency.name)
          .extendWithMixins(target, dependency.mixins)
          .registerDisposableObject(target)
      if (dependency.scope === 'singleton') {
        dependency.singletonObject = target
        dependency.factory = () => dependency.singletonObject
      }
      return target
    }).bind(this)

    this.dependencies.push(dependency)

    return this
  }

  registerDisposableObject(target) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    if (typeof(target.dispose) === 'function') {
      this.disposableObjects.push(target)
    }
    return this
  }

  extendWithMixins(target, mixinNames) {
    mixinNames.forEach(mixinName => this.extendWithMixin(mixinName))
    return this
  }

  extendWithMixin(target, mixinName) {
    let mixinObject = this.getDependency(mixinName).factory()
    let mixinPropertiesObject = this.getPropertiesObject(mixinObject)
    Object.defineProperties(target, mixinPropertiesObject)
    return this
  }

  populateProperties(target) {
    let container = this
    Object.keys(target).forEach(propertyName => {
      if (target[propertyName] == null) {
        target[propertyName] = container.getDependency(propertyName, true).factory()
      }
    })
    return this
  }

  populateConfigProperty(target, dependencyName) {
    let configValue = this.getConfigValue(dependencyName)
    if (configValue) {
      target.config = target.config || {}
      merge.recursive(target.config, configValue)
    }
    return this
  }

  dispose() {
    while(this.disposableObjects.length) {
      this.disposableObjects.pop().dispose()
    }
    return this
  }

  getPropertiesObject(mixin) {
    let mixinType = typeof(mixin)
    switch(mixinType) {
      case 'function': {
        let mixinObject = null
        if (mixin.name.length === 0) {
          mixinObject = mixin()
        } else {
          mixinObject = Object.create(mixin.prototype)
          mixin.apply(mixinObject)
        }
        return Object.getOwnPropertyNames(mixin.prototype).filter(name => name !== 'constructor').reduce((result, name) => {
          result[name] = Object.getOwnPropertyDescriptor(mixin.prototype, name)
          return result
        }, this.getPropertiesObject(mixinObject))
      }
      case 'object': {
        return Object.getOwnPropertyNames(mixin).reduce((result, name) => {
          result[name] = Object.getOwnPropertyDescriptor(mixin, name)
          return result
        }, {})
      }
      default: {
        throwInvalidMixinType()
      }
    }
  }
}
