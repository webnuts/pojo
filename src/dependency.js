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
      let dependency = this
      if (dependency.lifecycle === 'singleton') {
        if (dependency.singletonState === undefined) {
          dependency.singletonState = 'initialized'
          Promise.resolve(dependency.baseFactory(container)).then(dependencyObject => {
            dependency.singletonObject = dependencyObject
            if (typeof(dependency.disposer) === 'function') {
              dependency.tracked.push(dependency.singletonObject)
            }
            dependency.singletonState = 'created'
          })
        }
        let getSingletonObject = () => {
          return Promise.resolve(dependency.singletonState).then(state => {
            if (state === 'created') {
              getSingletonObject = () => dependency.singletonObject
              return dependency.singletonObject
            } else {
              return Promise.delay(1).then(() => getSingletonObject())
            }
          })
        }
        return getSingletonObject()
      } else {
        return Promise.resolve(dependency.baseFactory(container)).then(dependencyObject => {
          if (typeof(dependency.disposer) === 'function') {
            dependency.tracked.push(dependencyObject)
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
