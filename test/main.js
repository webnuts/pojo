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
  pojo.add('test', c => [c.config('value1'), c.config('value2')])
  let container = pojo.createContainer({value1: 'a', value2: 'b'})

  let test1 = container.get('test')
  t.deepEqual(test1, ['a', 'b'])

  let nestedContainer = container.createNestedContainer({value2: 'c'})

  let test2 = nestedContainer.get('test')
  t.deepEqual(test2, ['a', 'c'])

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

  pojo.add('databaseClient', c => new DatabaseClient(c.config('connectionString')))

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
  let nestedContainer3 = nestedContainer2.createNestedContainer()
  t.deepEqual(nestedContainer3.get(Transient), {count: 7})
  t.deepEqual(nestedContainer3.get(Transient), {count: 7})
  t.deepEqual(container.get(Transient), {count: 8})
  t.deepEqual(nestedContainer2.get(Transient), {count: 5})
  t.deepEqual(nestedContainer3.get(Transient), {count: 7})
  t.end()
})
