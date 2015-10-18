import Promise from 'bluebird'
import deasync from 'deasync'

export default class Dependency {
  static parse(dependencyName, factoryCandidate, disposer, lifecycle) {
    if (dependencyName == null || dependencyName.length === 0) {
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

    return new Dependency(dependencyName, factory, disposer, lifecycle)
  }

  constructor(dependencyName, baseFactory, disposer, lifecycle = 'unique') {
    this.name = dependencyName
    this.baseFactory = baseFactory
    this.disposer = disposer
    this.lifecycle = lifecycle
    this.tracked = []
    this.factory = Promise.method(container => {
      if (this.lifecycle === 'singleton') {
        if (this.singletonObject === undefined) {
          this.singletonObject = Promise.resolve(this.baseFactory(container)).bind(this).then(dependencyObject => {
            this.singletonObject = dependencyObject
          })
          let isNotResolved = (() => {
            return (this.singletonObject || {}).constructor === Promise
          }).bind(this)
          deasync.loopWhile(() => isNotResolved())
          if (typeof(this.disposer) === 'function') {
            this.tracked.push(this.singletonObject)
          }
        }
        return this.singletonObject
      } else {
        return Promise.resolve(this.baseFactory(container)).bind(this).then(dependencyObject => {
          if (typeof(this.disposer) === 'function') {
            this.tracked.push(dependencyObject)
          }
          return dependencyObject
        })
      }
    })
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
