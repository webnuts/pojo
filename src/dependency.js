import Promise from 'bluebird'

export default class Dependency {
  static parse(name, factoryCandidate, disposer, lifecycle) {
    if (name == null || name.length === 0) {
      throw new Error('Cannot add a dependency without a name. The first argument must be a string with the name.')
    }

    let factory = null
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

    return new Dependency(name, factory, disposer, lifecycle)
  }

  constructor(name, baseFactory, disposer, lifecycle = 'unique') {
    this.name = name
    this.baseFactory = baseFactory
    this.disposer = disposer
    this.lifecycle = lifecycle
    this.tracked = []
    this.factory = (function(container) {
      if (this.lifecycle === 'singleton' && this.singletonObject != null) {
        return this.singletonObject
      }
      let dependencyObject = this.baseFactory(container)
      if (typeof(this.disposer) === 'function') {
        this.tracked.push(dependencyObject)
      }
      if (this.lifecycle === 'singleton') {
        this.singletonObject = dependencyObject
      }
      return dependencyObject
    }).bind(this)
  }

  getDisposer() {
    return Promise.try(() => {
      let disposers = []
      if (typeof(this.disposer) === 'function') {
        while(this.tracked.length) {
          disposers.push(Promise.resolve(this.tracked.pop()).then(subject => {
            return Promise.resolve(this.disposer(subject)).thenReturn(subject)
          }))
        }
        this.singletonObject = undefined
      }
      return Promise.all(disposers)
    })
  }

  clone(lifecycle) {
    return new Dependency(this.name, this.baseFactory, this.disposer, lifecycle || this.lifecycle)
  }
}
