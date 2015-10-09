import Pojo from '../src/main'
import test from 'tape'
import Promise from 'bluebird'

test('empty container', t => {
  let pojo = new Pojo()
  let container = pojo.createContainer()

  return Promise.all([container.getAll(), container.getAll('unknown')]).then(([all1, all2]) => {

  }).then(() => {
    return container.get('unknown')
  }).catch(t.throws).then(t.end)
})

test('container referencing dependencies', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClient {
    constructor(connectionString) {
      this.connectionString = connectionString
    }
  }

  let pojo = new Pojo()
  pojo.add('connectionString', connectionString)
  pojo.add('databaseClient', c => c.get('connectionString').then(connStr => new DatabaseClient(connStr)))

  let container = pojo.createContainer()

  return container.get('databaseClient').then(dbClient => {
    t.equal(dbClient.connectionString, connectionString)
    t.end()
  })
})

test('injecting property onto dependency', t => {
  let connectionString = 'http://127.0.0.1:80'
  class DatabaseClient {}

  let pojo = new Pojo()
  pojo.add('connectionString', connectionString)
  pojo.add('databaseClient', c => {
    let client = new DatabaseClient()
    return c.get('connectionString').then(connStr => {
      client.connectionString = connStr
      return client
    })
  })

  let container = pojo.createContainer()
  return container.get('databaseClient').then(dbClient => {
    t.equal(dbClient.connectionString, connectionString)
    t.end()
  })
})

test('nested container should override config', t => {
  let pojo = new Pojo()
  pojo.add('test', c => c.config.get('value1', 'value2'))
  let container = pojo.createContainer({value1: 'a', value2: 'b'})

  return container.get('test').then(test1 => {
    t.deepEqual(test1, {value1: 'a', value2: 'b'})
    return container.createNestedContainer({value2: 'c'}).then(nestedContainer => {
      return nestedContainer.get('test').then(test2 => {
        t.deepEqual(test2, {value1: 'a', value2: 'c'})
        t.end()
      })
    })
  })
})

test('getting unknown config key should throw error', t => {
  let pojo = new Pojo()
  pojo.add('unknownConfigValue', c => c.config.get('unknown'))
  let container = pojo.createContainer()
  return container.get('unknownConfigValue').catch(t.throws).then(t.end)
})

test('try getting unknown config key should return undefined', t => {
  let pojo = new Pojo()
  pojo.add('unknownConfigValue', c => {
    return c.get('config').then(config => {
      return config.try('unknown')
    })
  })
  let container = pojo.createContainer()
  return container.get('unknownConfigValue').then(unknownConfigValue => {
    t.equal(unknownConfigValue, undefined)
    t.end()
  })
})

test('parent containers singleton should be available in nested container', t => {
  let ctorCount = 0
  class Singleton {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let pojo = new Pojo()
  pojo.addSingleton('singleton', c => new Singleton())

  let container = pojo.createContainer()

  return container.get('singleton').then(singletonObject1 => {
    t.deepEqual(singletonObject1, {count: 1})
    singletonObject1.test = 'abc'

    return container.get('singleton').then(singletonObject2 => {
      t.deepEqual(singletonObject2, {count: 1, test: 'abc'})

      return container.createNestedContainer().then(nestedContainer => {
        return nestedContainer.get('singleton').then(singletonObject3 => {
          t.deepEqual(singletonObject3, {count: 1, test: 'abc'})
          t.end()
        })
      })
    })
  })
})

test('inject config into dependency constructor', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClient {
    constructor(connectionString) {
      this.connectionString = connectionString
    }
  }

  let pojo = new Pojo()

  pojo.add('databaseClient', c => {
    return c.get('config').then(config => {
      return new DatabaseClient(config.get('connectionString'))
    })
  })

  let container = pojo.createContainer({connectionString: connectionString})

  return container.get('databaseClient').then(dbClient => {
    t.equal(dbClient.connectionString, connectionString)
    t.end()
  })
})

test('inject dependency into other dependencys constructor', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClient {
    constructor(connectionString) {
      this.connectionString = connectionString
    }
  }

  let pojo = new Pojo()

  pojo.add('connectionString', connectionString)
  pojo.add('databaseClient', c => c.get('connectionString').then(connStr => new DatabaseClient(connStr)))

  let container = pojo.createContainer({connectionString: connectionString})
  return container.get('databaseClient').then(dbClient => {
    t.equal(dbClient.connectionString, connectionString)
    t.end()
  })
})

test('get multiple dependencies with the same name', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.add('number', 2)
  pojo.add('number', 3)

  let container = pojo.createContainer()
  return container.getAll('number').then(numbers => {
    t.deepEqual(numbers, [1,2,3])
    t.end()
  })
})

test('add dependency if it doesnt exists already', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.addIfNotExists('number', 2)

  let container = pojo.createContainer()
  return container.getAll('number').then(numbers => {
    t.deepEqual(numbers, [1])
    t.end()
  })
})

test('remove dependency', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.add('number', 2)
  pojo.add('letter', 'a')

  pojo.remove('number')

  let container = pojo.createContainer()
  return Promise.all([container.getAll('number'), container.getAll('letter')]).then(([numbers, letters]) => {
    t.deepEqual(numbers, [])
    t.deepEqual(letters, ['a'])
    t.end()
  })
})

test('each container should have unique singletons', t => {
  let ctorCount = 0
  class Singleton {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let pojo = new Pojo()
  pojo.addSingleton('singleton', c => new Singleton())

  let container1 = pojo.createContainer()
  let container2 = pojo.createContainer()

  return Promise.all([container1.get('singleton'), container2.get('singleton')]).then(([singleton1, singleton2]) => {
    t.deepEqual(singleton1, {count: 1})
    t.deepEqual(singleton2, {count: 2})
    t.end()
  })
})

test('transient dependency should be singleton in nested container', t => {
  let ctorCount = 0
  class Transient {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let pojo = new Pojo()
  pojo.addTransient('transient', c => new Transient())
  let container = pojo.createContainer()
  return Promise.all([container.get('transient'), container.get('transient')]).then(([transient1, transient2]) => {
    t.deepEqual(transient1, {count: 1})
    t.deepEqual(transient2, {count: 2})
    return container.createNestedContainer().then(nestedContainer1 => {
      return Promise.all([nestedContainer1.get('transient'), nestedContainer1.get('transient'), container.get('transient'), nestedContainer1.get('transient')]).then(([transient3, transient4, transient5, transient6]) => {
        t.deepEqual(transient3, {count: 3})
        t.deepEqual(transient4, {count: 3})
        t.deepEqual(transient5, {count: 4})
        t.deepEqual(transient6, {count: 3})

        return container.createNestedContainer().then(nestedContainer2 => {
          return Promise.all([nestedContainer2.get('transient'), nestedContainer2.get('transient'), container.get('transient'), nestedContainer2.get('transient')]).then(([transient7, transient8, transient9, transient10]) => {
            t.deepEqual(transient7, {count: 5})
            t.deepEqual(transient8, {count: 5})
            t.deepEqual(transient9, {count: 6})
            t.deepEqual(transient10, {count: 5})
            t.end()
          })
        })
      })
    })
  })
})

test('prevent "container" for being added (reserved for current container)', t => {
  let pojo = new Pojo()
  t.throws(() => pojo.add('container', 'test'))
  t.end()
})

test('"container" dependency should be the current container', t => {
  let pojo = new Pojo()
  let container = pojo.createContainer()
  let reference = container.label = 'my container'
  return container.get('container').then(foundDep => {
    t.equal(foundDep.label, reference)
    return container.createNestedContainer().then(nestedContainer => {
      let nestedReference = nestedContainer.label = 'my nested container'
      return nestedContainer.get('container').then(foundNestedDep => {
        t.equal(foundNestedDep.label, nestedReference)
        t.end()
      })
    })
  })
})

test('"config" dependency should be current containers config data', t => {
  let pojo = new Pojo()
  let config = {a:1, b:2}
  let container = pojo.createContainer(config)
  return container.get('config').then(configDep => {
    t.deepEqual(configDep.get(), config)
    t.end()
  })
})

test('trying getting config should return default values', t => {
  let pojo = new Pojo()
  let config = {a:{b:2}}
  pojo.add('conf1', c => c.get('config').then(config => config.tryOrDefault(1, 'z')))
  pojo.add('conf2', c => c.get('config').then(config => config.tryOrDefault({c:3}, 'a')))
  pojo.add('conf3', c => c.get('config').then(config => config.tryOrDefault({c:3}, 'b')))
  let container = pojo.createContainer(config)
  return Promise.all([container.get('conf1'), container.get('conf2'), container.get('conf3')]).then(([conf1, conf2, conf3]) => {
    t.equal(conf1, 1)
    t.deepEqual(conf2, {b:2})
    t.deepEqual(conf3, {c:3})
    t.end()
  })
})

test('try getting dependency', t => {
  let pojo = new Pojo()
  pojo.add('test', c => 'test')
  let container = pojo.createContainer()
  return Promise.all([container.try('bla'), container.try('test')]).then(([try1, try2]) => {
    t.equal(try1, undefined)
    t.equal(try2, 'test')
    t.end()
  })
})

test('try getting nested config', t => {
  let pojo = new Pojo()
  pojo.add('test', c => c.get('config').then(config => config.try('a.b.c')))
  let container = pojo.createContainer({a: {b: {c: 123}}})
  return container.get('test').then(test => {
    t.equal(test, 123)
    t.end()
  })
})

test('get nested config', t => {
  let pojo = new Pojo()
  pojo.add('test', c => c.get('config').then(config => config.get('a.b.c')))
  let container = pojo.createContainer({a: {b: {c: 123}}})
  return container.get('test').then(test => {
    t.equal(test, 123)
    t.end()
  })
})

test('dispose unique objects', t => {
  let pojo = new Pojo()
  let disposed = []

  pojo.add('number', 1, n => disposed.push(n))
  pojo.add('number', 2, n => disposed.push(n))

  let container = pojo.createContainer()
  return container.getAll('number').then(numbers => {
    return container.dispose().then(disposedObjects => {
      t.deepEqual(disposedObjects, disposed)
      return container.dispose().then(disposedObjects => {
        t.deepEqual(disposedObjects, [])
        t.end()
      })
    })
  })
})

test('dispose singleton objects', t => {
  let pojo = new Pojo()
  let disposed = []
  let count = 1

  pojo.addSingleton('number', c => count++, n => disposed.push(n))
  pojo.addSingleton('number', c => count++, n => disposed.push(n))

  let container = pojo.createContainer()
  return Promise.all([container.getAll('number'), container.getAll('number')]).then(([numbers1, numbers2]) => {
    t.deepEqual(numbers1, [1,2])
    t.deepEqual(numbers2, [1,2])
    return container.dispose().then(disposedObjects => {
      t.deepEqual(disposedObjects, disposed)
      return container.dispose().then(disposedObjects => {
        t.deepEqual(disposedObjects, [])
        t.end()
      })
    })
  })
})

test('dispose transient objects', t => {
  let pojo = new Pojo()
  let disposed = []
  let count = 1

  pojo.addTransient('number', c => count++, n => disposed.push(n))
  pojo.addTransient('number', c => count++, n => disposed.push(n))

  let container = pojo.createContainer()
  return Promise.all([container.getAll('number'), container.getAll('number')]).then(([numbers1, numbers2]) => {
    t.deepEqual(numbers1, [1,2])
    t.deepEqual(numbers2, [3,4])
    return container.createNestedContainer().then(nested => {
      return Promise.all([nested.getAll('number'), nested.getAll('number')]).then(([numbers3, numbers4]) => {
        t.deepEqual(numbers3, [5,6])
        t.deepEqual(numbers4, [5,6])
        return Promise.all([container.dispose(), nested.dispose()]).then(([disposedObjects1, disposedObjects2]) => {
          let disposedObjects = disposedObjects1.concat(disposedObjects2)
          t.deepEqual(disposedObjects, disposed)
          return Promise.all([container.dispose(), nested.dispose()]).then(([disposedObjects3, disposedObjects4]) => {
            let disposedObjects = disposedObjects3.concat(disposedObjects4)
            t.deepEqual(disposedObjects, [])
            t.end()
          })
        })
      })
    })
  })
})
