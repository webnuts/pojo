export default class Constructor {
  constructor(container) {
    this.container = container
  }

  get config() {
    return this.container.config
  }

  get(nameOrFunction) {
    return this.container.get(nameOrFunction)
  }

  getAll(nameOrFunction) {
    return this.container.getAll(nameOrFunction)
  }

  extend(target, nameOrCtorFunctionOrObject) {
    let mixinObject = null
    switch(typeof(nameOrCtorFunctionOrObject)) {
      case 'function':
      case 'string': {
        mixinObject = this.get(nameOrCtorFunctionOrObject)
        break
      }
      case 'object': {
        mixinObject = nameOrCtorFunctionOrObject
        break
      }
    }
    if (mixinObject) {
      let propertiesObject = Object.getOwnPropertyNames(mixinObject).reduce((result, name) => {
        result[name] = Object.getOwnPropertyDescriptor(mixinObject, name)
        return result
      }, {})
      Object.defineProperties(target, propertiesObject)
    }
  }
}
