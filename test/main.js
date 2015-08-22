import Pojo from '../src/main'
import test from 'tape'

test('empty container', t => {
  let pojo = new Pojo()
  let container = pojo.createContainer()

  t.throws(() => container.get('unknown'))
  t.deepEqual(container.getAll(), [])
  t.deepEqual(container.getAll('unknown'), [])

  t.end()
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
  pojo.add('databaseClient', c => new DatabaseClient(c.get('connectionString')))

  let container = pojo.createContainer()

  let databaseClient = container.get('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('injecting property onto dependency', t => {
  let connectionString = 'http://127.0.0.1:80'
  class DatabaseClient {}

  let pojo = new Pojo()
  pojo.add('connectionString', connectionString)
  pojo.add('databaseClient', c => {
    let client = new DatabaseClient()
    client.connectionString = c.get('connectionString')
    return client
  })

  let container = pojo.createContainer()
  let databaseClient = container.get('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('extending dependency with mixin', t => {
  let connectionString = 'http://127.0.0.1:80'
  class ConnectionString {
    constructor() {
      this.connectionString = connectionString
    }
  }
  class DatabaseClient {}

  let pojo = new Pojo()
  pojo.add(ConnectionString)
  pojo.add('databaseClient', c => {
    let client = new DatabaseClient()
    c.extend(client, ConnectionString)
    return client
  })

  let container = pojo.createContainer()
  let databaseClient = container.get('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('nested container should override config', t => {
  let pojo = new Pojo()
  pojo.add('test', c => c.config.get('value1', 'value2'))
  let container = pojo.createContainer({value1: 'a', value2: 'b'})

  let test1 = container.get('test')
  t.deepEqual(test1, {value1: 'a', value2: 'b'})

  let nestedContainer = container.createNestedContainer({value2: 'c'})

  let test2 = nestedContainer.get('test')
  t.deepEqual(test2, {value1: 'a', value2: 'c'})

  t.end()
})

test('getting unknown config key should throw error', t => {
  let pojo = new Pojo()
  pojo.add('unknownConfigValue', c => c.config.get('unknown'))
  let container = pojo.createContainer()
  t.throws(() => container.get('unknownConfigValue'))
  t.end()
})

test('try getting unknown config key should return undefined', t => {
  let pojo = new Pojo()
  pojo.add('unknownConfigValue', c => c.config.try('unknown'))
  let container = pojo.createContainer()
  t.equal(container.get('unknownConfigValue'), undefined)
  t.end()
})

test('parent containers singleton should be available in nested container', t => {
  let ctorCount = 0
  class Singleton {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let pojo = new Pojo()
  pojo.addSingleton(Singleton)

  let container = pojo.createContainer()

  let singletonObject = container.get(Singleton)
  t.deepEqual(singletonObject, {count: 1})

  singletonObject.test = 'abc'
  t.deepEqual(container.get(Singleton), {count: 1, test: 'abc'})

  let nestedContainer = container.createNestedContainer()
  t.deepEqual(nestedContainer.get(Singleton), {count: 1, test: 'abc'})
  t.end()
})

test('inject config into dependency constructor', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClient {
    constructor(connectionString) {
      this.connectionString = connectionString
    }
  }

  let pojo = new Pojo()

  pojo.add('databaseClient', c => new DatabaseClient(c.config.get('connectionString')))

  let container = pojo.createContainer({connectionString: connectionString})
  let databaseClient = container.get('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
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
  pojo.add('databaseClient', c => new DatabaseClient(c.get('connectionString')))

  let container = pojo.createContainer({connectionString: connectionString})
  let databaseClient = container.get('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('get multiple dependencies with the same name', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.add('number', 2)
  pojo.add('number', 3)

  let container = pojo.createContainer()

  t.deepEqual(container.getAll('number'), [1,2,3])
  t.end()
})

test('add dependency if it doesnt exists already', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.addIfNotExists('number', 2)

  let container = pojo.createContainer()

  t.deepEqual(container.getAll('number'), [1])
  t.end()
})

test('remove dependency', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.add('number', 2)
  pojo.add('letter', 'a')

  pojo.remove('number')

  let container = pojo.createContainer()

  t.deepEqual(container.getAll('number'), [])
  t.deepEqual(container.getAll('letter'), ['a'])
  t.end()
})

test('replace dependency', t => {
  let pojo = new Pojo()

  pojo.add('number', 1)
  pojo.add('number', 2)
  pojo.add('letter', 'a')
  pojo.replace('number', 3)

  let container = pojo.createContainer()

  t.deepEqual(container.getAll('number'), [3])
  t.deepEqual(container.getAll('letter'), ['a'])
  t.end()
})

test('each container should have unique singletons', t => {
  let ctorCount = 0
  class Singleton {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let pojo = new Pojo()
  pojo.addSingleton(Singleton)

  let container1 = pojo.createContainer()
  let container2 = pojo.createContainer()

  let singleton1 = container1.get(Singleton)
  let singleton2 = container2.get(Singleton)

  t.deepEqual(container1.get(Singleton), {count: 1})
  t.deepEqual(container2.get(Singleton), {count: 2})
  t.end()
})

test('transient dependency should be singleton in nested container', t => {
  let ctorCount = 0
  class Transient {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let pojo = new Pojo()
  pojo.addTransient(Transient)
  let container = pojo.createContainer()
  t.deepEqual(container.get(Transient), {count: 1})
  t.deepEqual(container.get(Transient), {count: 2})
  let nestedContainer1 = container.createNestedContainer()
  t.deepEqual(nestedContainer1.get(Transient), {count: 3})
  t.deepEqual(nestedContainer1.get(Transient), {count: 3})
  t.deepEqual(container.get(Transient), {count: 4})
  t.deepEqual(nestedContainer1.get(Transient), {count: 3})
  let nestedContainer2 = container.createNestedContainer()
  t.deepEqual(nestedContainer2.get(Transient), {count: 5})
  t.deepEqual(nestedContainer2.get(Transient), {count: 5})
  t.deepEqual(container.get(Transient), {count: 6})
  t.deepEqual(nestedContainer2.get(Transient), {count: 5})
  t.throws(() => nestedContainer2.createNestedContainer())
  t.end()
})

test('prevent "container" for being added (reserved for current container)', t => {
  let pojo = new Pojo()
  t.throws(() => pojo.add('container', 'test'))
  t.end()
})

test('"container" dependency should be the current container', t => {
  let pojo = new Pojo()
  let container = pojo.createContainer()
  let reference = 'my container'
  container.label = reference
  let foundDep = container.get('container')
  t.equal(foundDep.label, reference)
  let nestedContainer = container.createNestedContainer()
  let nestedReference = 'my nested container'
  nestedContainer.label = nestedReference
  let foundNestedDep = nestedContainer.get('container')
  t.equal(foundNestedDep.label, nestedReference)
  t.end()
})

test('"config" dependency should be current containers config data', t => {
  let pojo = new Pojo()
  let config = {a:1, b:2}
  let container = pojo.createContainer(config)
  t.deepEqual(container.get('config'), config)
  t.end()
})

test('trying getting config should return default values', t => {
  let pojo = new Pojo()
  let config = {a:{b:2}}
  pojo.add('conf1', c => c.config.tryOrDefault(1, 'z'))
  pojo.add('conf2', c => c.config.tryOrDefault({c:3}, 'a'))
  pojo.add('conf3', c => c.config.tryOrDefault({c:3}, 'b'))
  let container = pojo.createContainer(config)
  t.equal(container.get('conf1'), 1)
  t.deepEqual(container.get('conf2'), {b:2})
  t.deepEqual(container.get('conf3'), {c:3})
  t.end()
})
