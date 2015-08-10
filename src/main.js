import merge from 'merge'

let throwNoDependencyExist = (name) => { throw new Error('No dependency exist with name "' + mixinName + "'.") }
let throwMultipleDependenciesExists = (name) => { throw new Error('Multiple dependencies exist with name "' + name + '". Use function getAllObjects(dependencyName) to retrieve multiple objects.') }
let throwInvalidScope = (name) => { throw new Error('Invalid scope: ' + name) }
let throwInvalidFactoryOrObject = () => { throw new Error('A dependency must be a function or an object.') }
let throwInvalidFactory = () => { throw new Error('A decorator must be a function.') }
let throwInvalidDecorator = () => { throw new Error('A dependency must be a function.') }
let throwDependencyWithoutName = () => { throw new Error('Cannot add a dependency without a name. Use a named function (class) or use option {name: "SomeName"}.') }
let throwDecoratorWithoutName = () => { throw new Error('Cannot add a decorator without a name. Use a named function (class) or use option {name: "SomeName"}.') }
let throwInvalidMixinType = () => { throw new Error('Invalid mixin type: ' + mixinType) }
let throwIsDisposed = () => { throw new Error('The Pojo object has been disposed. Create a new Pojo object.') }
let throwDependencyCreatedNullOrUndefined = (name) => { throw new Error('Dependency "' + name + '" created null or undefined.') }
let throwDecoratorCreatedNullOrUndefined = (name) => { throw new Error('Decorator "' + name + '" created null or undefined.') }

export default class Pojo {
  constructor(config, parent) {
    this.config = config || {}
    this.parent = parent
    this.childContainers = []
    this.dependencies = []
    this.decorators = []
    this.disposableObjects = []
    this.isDisposed = false
  }

  getObject(dependencyName) {
    let dependencyObject = this.getDependency(dependencyName).factory()
    if (!dependencyObject) {
      throwNoDependencyExist(dependencyName)
    }
    return dependencyObject
  }

  getAllObjects(dependencyName) {
    return this.getDependencies(dependencyName).map(dependency => dependency.factory())
  }

  getDependency(dependencyName) {
    let matchingDependencies = this.getDependencies(dependencyName)
    if (1 < matchingDependencies.length) {
      throwMultipleDependenciesExists(dependencyName)
    } else {
      return matchingDependencies[0] || {factory: () => undefined}
    }
  }

  getDependencies(dependencyName) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    if (dependencyName === undefined) {
      return this.dependencies.slice(0)
    } else {
      return this.dependencies.filter(dependency => dependency.name === dependencyName)
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

  addDecorator(constructorOrFunction, options) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    let decorator = merge.recursive({mixins: []}, options || {})
    if (typeof(constructorOrFunction) !== 'function') {
      throwInvalidDecorator()
    }
    
    let baseFactory = null
    switch(typeof(constructorOrFunction || 'ignoreNull')) {
      case 'function': {
        if (constructorOrFunction.name.length === 0) {
          baseFactory = constructorOrFunction
        } else {
          if (decorator.name == null) {
            decorator.name = constructorOrFunction.name
          } 
          baseFactory = function() {
            let target = Object.create(constructorOrFunction.prototype)
            constructorOrFunction.apply(target, arguments)
            return target
          }
        }
        break
      }
      default: {
        throwInvalidFactory()
      }
    }

    if (decorator.name == null || decorator.name.length === 0) {
      throwDecoratorWithoutName()
    }

    decorator.factory = () => {
      let target = baseFactory.apply(null, arguments)

      if (target == null) {
        throwDecoratorCreatedNullOrUndefined(decorator.name)
      }

      this.populateProperties(target)
          .populateConfigProperty(target, decorator.name)
          .extendWithMixins(target, decorator.mixins)
          .registerDisposableObject(target)
      return target
    }

    this.decorators.push(decorator)

    return this
  }

  extendWithDecorators(target, decoratorNames) {
    decoratorNames.forEach(decoratorName => this.extendWithDecorator(target, decoratorName))
    return this
  }

  extendWithDecorator(target, decoratorName) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    this.decorators.filter(decorator => decorator.name === decoratorName).forEach(decorator => decorator.factory(target))
    return this
  }

  addDependency(constructorOrFactoryOrObject, options) {
    if (this.isDisposed) {
      throwIsDisposed()
    }
    if (constructorOrFactoryOrObject == null) {
      throwInvalidFactoryOrObject()
    }

    let dependency = merge.recursive({scope: 'prototype', mixins: [], decorators: []}, options || {})

    if (['singleton', 'prototype'].indexOf(dependency.scope) === -1) {
      throwInvalidScope(dependency.scope)
    }

    let baseFactory = null
    switch(typeof(constructorOrFactoryOrObject)) {
      case 'function': {
        if (constructorOrFactoryOrObject.name.length === 0) {
          baseFactory = constructorOrFactoryOrObject
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

      if (target == null) {
        throwDependencyCreatedNullOrUndefined(dependency.name)
      }

      this.populateProperties(target)
          .populateConfigProperty(target, dependency.name)
          .extendWithMixins(target, dependency.mixins)
          .extendWithDecorators(target, dependency.decorators)
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
    mixinNames.forEach(mixinName => this.extendWithMixin(target, mixinName))
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
        target[propertyName] = container.getDependency(propertyName).factory()
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
    if (this.isDisposed) {
      throwIsDisposed()
    }
    while(this.disposableObjects.length) {
      this.disposableObjects.pop().dispose()
    }
    this.isDisposed = true
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
