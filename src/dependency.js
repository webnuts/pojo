import merge from 'merge'
import Constructor from './constructor'

export default class Dependency {
  static parse(...args) {
    let name = null, factoryCandidate = null, options = {}, factory = null

    if (typeof(args[0]) === 'string') {
      name = args[0]
      factoryCandidate = args[1]
      options = args[2]
    } else {
      name = args[0].name
      factoryCandidate = args[0]
      options = args[1]
    }

    if (name == null || name.length === 0) {
      throw new Error('Cannot add a dependency without a name. Use a named function (class) or let the first argument be a string with the name.')
    }

    switch(typeof(factoryCandidate)) {
      case 'function': {
        if (factoryCandidate.name.length === 0) {
          factory = container => factoryCandidate(new Constructor(container))
        } else {
          factory = () => new factoryCandidate()
        }
        break
      }
      case 'object': {
        if (factoryCandidate == null) {
          throw new Error('Cannot add null or undefined as a dependency factory.')
        }
        if (factoryCandidate.prototype) {
          factory = () => {
            let product = Object.create(factoryCandidate.prototype)
            factoryCandidate.prototype.constructor.apply(product)
            return product
          }
        } else {
          factory = () => merge.recursive(true, {}, factoryCandidate)
        }
        break
      }
      default: {
        factory = () => factoryCandidate
      }
    }

    return new Dependency(name, factory, options)
  }

  constructor(name, factory, options) {
    this.lifecycle = 'unique'
    merge.recursive(this, options || {})
    this.name = name
    this.factory = (function(container) {
      if (this.lifecycle === 'singleton' && this.singletonObject != null) {
        return this.singletonObject
      }
      let dependencyObject = factory(container)
      if (this.lifecycle === 'singleton') {
        this.singletonObject = dependencyObject
      }
      return dependencyObject
    }).bind(this)
  }

  asSingleton() {
    this.lifecycle = 'singleton'
    return this
  }

  // clone() {
  //   return new Dependency(this.name, this.factory, {lifecycle: this.lifecycle})
  // }
}
