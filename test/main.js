import Container from '../src/container'
import test from 'tape'
import merge from 'merge'

test('empty container', t => {
  let container = new Container()

  t.deepEqual(container.config, {})
  t.equal(container.parent, undefined)
  t.deepEqual(container.childContainers, [])
  t.deepEqual(container.dependencies, [])
  t.throws(() => container.getObject('unknown'))
  t.deepEqual(container.getAllObjects(), [])
  t.deepEqual(container.getAllObjects('unknown'), [])
  t.deepEqual(container.getDependencies(), [])
  t.deepEqual(container.getDependencies('unknown'), [])
  
  t.end()  
})

test('container with 1 simple dependency', t => {
  let connectionString = 'http://127.0.0.1:80'
  let container = new Container()
  
  container.addDependency(connectionString, {name: 'connectionString'})

  let answer = container.getObject('connectionString')

  t.equal(answer, connectionString)
  t.end()
})

test('container referencing dependencies', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClient {
    constructor(connectionString) {
      this.connectionString = connectionString
    }
  }

  let container = new Container()
  container.addDependency(connectionString, {name: 'connectionString'})
  container.addDependency(DatabaseClient).constructWith('connectionString')
  container.validate()

  let databaseClient = container.getObject('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('injecting property into dependency', t => {
  let connectionString = 'http://127.0.0.1:80'
  class DatabaseClient {}

  let container = new Container()
  container.addDependency(connectionString, {name: 'connectionString'})
  container.addDependency(DatabaseClient).withProperty('connectionString', 'connectionString')
  container.validate()

  let databaseClient = container.getObject('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('extending dependency with mixin', t => {
  let connectionStringObj = {connectionString: 'http://127.0.0.1:80'}
  class DatabaseClient {}

  let container = new Container()
  container.addDependency(connectionStringObj, {name: 'connectionString'})
  container.addDependency(DatabaseClient).withMixin('connectionString')
  container.validate()

  let databaseClient = container.getObject('databaseClient')

  t.equal(databaseClient.connectionString, connectionStringObj.connectionString)
  t.end()
})

test('extending dependency with decorator', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClientDecorator {
    decorate(target) {
      target.connectionString = connectionString
    }
  }

  class DatabaseClient {}

  let container = new Container()
  container.addDependency(DatabaseClientDecorator)
  container.addDependency(DatabaseClient).withDecorator(DatabaseClientDecorator)
  container.validate()

  let databaseClient = container.getObject('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('invalidate container with missing dependencies', t => {
  class DatabaseClient {}

  let container = new Container()
  container.addDependency(DatabaseClient).withDecorator('databaseClientDecorator')

  t.throws(() => container.validate())
  t.end()
})

test('nested container should override config', t => {
  let container = new Container({parentValue1: 'a', parentValue2: 'b'})

  t.equal(container.getConfigValue('parentValue1'), 'a')
  t.equal(container.getConfigValue('parentValue2'), 'b')

  let childContainer = container.createChild({'parentValue2': 'c'})

  t.equal(childContainer.getConfigValue('parentValue1'), 'a')
  t.equal(childContainer.getConfigValue('parentValue2'), 'c')

  t.end()
})

test('parent containers singleton should be available in child container', t => {
  let ctorCount = 0
  class Singleton {
    constructor() {
      this.count = ++ctorCount
    }
  }

  let container = new Container()
  container.addDependency(Singleton).asSingleton()
  let singletonObject = container.getObject('singleton')
  t.deepEqual(singletonObject, {count: 1})  
  
  singletonObject.test = 'abc'
  
  t.deepEqual(container.getObject('singleton'), {count: 1, test: 'abc'})

  let childContainer = container.createChild()
  t.deepEqual(childContainer.getObject('singleton'), {count: 1, test: 'abc'})
  t.end()
})

test('inject config into dependency constructor', t => {
  let connectionString = 'http://127.0.0.1:80'

  class DatabaseClient {
    constructor(connectionString) {
      this.connectionString = connectionString
    }
  }

  let container = new Container({connectionString: connectionString})
  container.addDependency(c => new DatabaseClient(c.config('connectionString')), {name: 'databaseClient'})
  container.validate()

  let databaseClient = container.getObject('databaseClient')

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

  let container = new Container()
  container.addDependency(connectionString, {name: 'connectionString'})
  container.addDependency(c => new DatabaseClient(c.getObject('connectionString')), {name: 'databaseClient'})
  container.validate()

  let databaseClient = container.getObject('databaseClient')

  t.equal(databaseClient.connectionString, connectionString)
  t.end()
})

test('get multiple dependencies with the same name', t => {
  let container = new Container()
  container.addDependency(1, {name: 'number'})
  container.addDependency(2, {name: 'number'})
  container.addDependency(3, {name: 'number'})

  t.deepEqual(container.getAllObjects('number'), [1,2,3])
  t.end()
})

test('add dependency if it doesnt exists already', t => {
  let container = new Container()
  container.addDependencyIfNotExists(1, {name: 'number'})
  container.addDependencyIfNotExists(2, {name: 'number'})  

  t.deepEqual(container.getAllObjects('number'), [1])
  t.end()  
})

test('remove dependency', t => {
  let container = new Container()
  container.addDependency(1, {name: 'number'})
  container.addDependency(2, {name: 'number'})
  container.addDependency('a', {name: 'letter'})
  container.removeDependency('number')  

  t.deepEqual(container.getAllObjects('number'), [])
  t.end()  
})
