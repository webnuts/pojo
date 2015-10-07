import merge from 'merge'

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
          factory = container => factoryCandidate(container)
        } else {
          factory = () => new factoryCandidate()
        }
        break
      }
      case 'object': {
        if (factoryCandidate == null) {
          throw new Error('Cannot add null or undefined as a dependency factory.')
        }
        factory = () => factoryCandidate
        break
      }
      default: {
        factory = () => factoryCandidate
      }
    }

    return new Dependency(name, factory, options)
  }

  constructor(name, baseFactory, options) {
    this.lifecycle = 'unique'
    merge.recursive(this, options || {})
    this.name = name
    this.baseFactory = baseFactory
    this.factory = (function(container) {
      if (this.lifecycle === 'singleton' && this.singletonObject != null) {
        return this.singletonObject
      // } else if (container.nested === true && this.lifecycle === 'transient' && this.transientObject != null) {
      //   return this.transientObject
      }
      let dependencyObject = this.baseFactory(container)
      if (this.lifecycle === 'singleton') {
        this.singletonObject = dependencyObject
      // } else if (container.nested === true && this.lifecycle === 'transient') {
      //   this.transientObject = dependencyObject
      }
      return dependencyObject
    }).bind(this)
  }

  asSingleton() {
    this.lifecycle = 'singleton'
    return this
  }

  asTransient() {
    this.lifecycle = 'transient'
    return this
  }

  clone() {
    return new Dependency(this.name, this.baseFactory, {lifecycle: this.lifecycle})
  }
}
