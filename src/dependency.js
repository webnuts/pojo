import merge from 'merge'
import inflector from 'inflected'
import Argument from './argument'
import ArgumentPicker from './argument-picker'
import Decorator from './decorator'
import Mixin from './mixin'
import Property from './property'

export default class Dependency {
  static getDependencyName(namedFunctionOrName) {
    let typeName = typeof(namedFunctionOrName)
    if (typeName === 'function' && 0 < namedFunctionOrName.name.length) {
      return inflector.camelize(inflector.underscore(namedFunctionOrName.name), false)
    } else if (typeName === 'string' && 0 < namedFunctionOrName.length) {
      return namedFunctionOrName
    }
  }

  static createFactory(factoryCandicate) {
    let baseFactory = null
    switch(typeof(factoryCandicate)) {
      case 'function': {
        if (factoryCandicate.name.length === 0) {
          baseFactory = function(argumentPicker) {
            return factoryCandicate(argumentPicker)
          }
        } else {
          baseFactory = function() {
            let ctorArgs = Array.prototype.slice.call(arguments, 1) // remove argumentPicker
            let dependencyObject = Object.create(factoryCandicate.prototype)
            factoryCandicate.apply(dependencyObject, ctorArgs)
            return dependencyObject
          }
        }
        break
      }
      case 'object': {
        baseFactory = () => merge.recursive(true, {}, factoryCandicate) // clone
        break
      }
      default: {
        baseFactory = () => factoryCandicate
        break
      }
    }

    return function factory(container) {
      if (this.scope === 'singleton' && this.singletonObject) {
        return this.singletonObject
      }
      let argumentPicker = new ArgumentPicker(container)
      let factoryArguments = [argumentPicker].concat(this.arguments.map(argument => argument.getObject(container)))
      let target = baseFactory.apply(null, factoryArguments)
      this.properties.forEach(property => property.setProperty(container, target))
      this.mixins.forEach(mixin => mixin.extend(container, target))
      this.decorators.forEach(decorator => decorator.decorate(container, target))
      if (this.scope === 'singleton') {
        this.singletonObject = target
      }
      return target
    }
  }

  constructor(factoryCandicate, options) {
    if (factoryCandicate == null) {
      throwInvalidFactoryOrObject()
    }

    this.name = Dependency.getDependencyName(factoryCandicate)
    this.arguments = []
    this.properties = []
    this.scope = 'prototype'
    this.mixins = []
    this.decorators = []

    merge.recursive(this, options || {})

    if(this.name == null || this.name.length === 0) {
      throw new Error('Cannot add a dependency without a name. Use a named function (or ES6 class) or use the option {name: "dependencyName"}.')
    }

    this.arguments = this.arguments.map(namedFunctionOrName => new Argument(Dependency.getDependencyName(namedFunctionOrName)))
    this.properties = this.properties.map(prop => new Property(prop.name, Dependency.getDependencyName(prop.dependency) || prop.name))
    this.mixins = this.mixins.map(namedFunctionOrName => new Mixin(Dependency.getDependencyName(namedFunctionOrName)))
    this.decorators = this.decorators.map(namedFunctionOrName => new Decorator(Dependency.getDependencyName(namedFunctionOrName)))
    this.factory = Dependency.createFactory(factoryCandicate).bind(this)
  }

  constructWith(...multipleNamedFunctionsOrNames) {
    if (Array.isArray(multipleNamedFunctionsOrNames[0])) {
      multipleNamedFunctionsOrNames = multipleNamedFunctionsOrNames[0]
    }
    this.arguments = multipleNamedFunctionsOrNames.map(namedFunctionOrName => new Argument(Dependency.getDependencyName(namedFunctionOrName)))
    return this
  }

  withProperty(propertyName, namedFunctionOrName) {
    let dependencyName = Dependency.getDependencyName(namedFunctionOrName)
    this.properties.push(new Property(propertyName, dependencyName || propertyName))
    return this
  }

  withMixin(namedFunctionOrName) {
    let dependencyName = Dependency.getDependencyName(namedFunctionOrName)
    this.mixins.push(new Mixin(dependencyName))
    return this
  }

  withMixins(...multipleNamedFunctionsOrNames) {
    if (Array.isArray(multipleNamedFunctionsOrNames[0])) {
      multipleNamedFunctionsOrNames = multipleNamedFunctionsOrNames[0]
    }
    return multipleNamedFunctionsOrNames.reduce((thisDependency, namedFunctionOrName) => thisDependency.withMixin(namedFunctionOrName), this)
  }

  withDecorator(namedFunctionOrName) {
    let dependencyName = Dependency.getDependencyName(namedFunctionOrName)
    this.decorators.push(new Decorator(dependencyName))
    return this
  }

  withDecorators(...multipleNamedFunctionsOrNames) {
    if (Array.isArray(multipleNamedFunctionsOrNames[0])) {
      multipleNamedFunctionsOrNames = multipleNamedFunctionsOrNames[0]
    }
    return multipleNamedFunctionsOrNames.reduce((thisDependency, namedFunctionOrName) => thisDependency.withDecorator(namedFunctionOrName), this)
  }

  asSingleton() {
    this.scope = 'singleton'
    return this
  }

  asPrototype() {
    this.scope = 'prototype'
    return this
  }

  validate(container) {
    this.arguments.forEach(argument => argument.validate(container, this))
    this.properties.forEach(property => property.validate(container, this))
    this.mixins.forEach(mixin => mixin.validate(container, this))
    this.decorators.forEach(decorator => decorator.validate(container, this))
    return this
  }
}
