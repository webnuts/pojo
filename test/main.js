import Pojo from '../src/main.js'
import test from 'tape'
import merge from 'merge'

test('empty container', t => {
  let container = new Pojo()

  t.deepEqual(container.config, {})
  t.equal(container.parent, undefined)
  t.deepEqual(container.childContainers, [])
  t.deepEqual(container.dependencies, [])
  t.deepEqual(container.decorators, [])
  t.deepEqual(container.disposableObjects, [])
  t.equal(container.isDisposed, false)
  t.throws(() => container.getObject('unknown'))
  t.deepEqual(container.getAllObjects(), [])
  t.deepEqual(container.getAllObjects('unknown'), [])
  t.deepEqual(container.getDependencies(), [])
  t.deepEqual(container.getDependencies('unknown'), [])
  
  t.end()
})

test('container with 1 prototype dependency', t => {
  let container = new Pojo({"my-dep": 'ping-pong'})
  let constructorCount = 0
  let disposeCount = 0
  let dependencyObject = {price: 123, dispose: () => disposeCount++ }
  let factoryResult = merge.recursive(dependencyObject, {config: 'ping-pong', mixedIn: true, decorated: true})

  let factory = () => {
    constructorCount++
    return merge.recursive(true, dependencyObject, {})
  }

  container.addDependency(factory, {name: 'my-dep', decorators: ['my-decorator'], mixins: ['my-mixin']})
  container.addDependency(() => {return {mixedIn: true}}, {name: 'my-mixin'})
  container.addDecorator(target => target.decorated = true, {name: 'my-decorator'})

  t.deepEqual(container.getObject('my-dep'), factoryResult)
  t.deepEqual(container.getAllObjects('my-dep'), [factoryResult])

  container.dispose()
  t.equal(disposeCount, 2)
  t.throws(() => container.dispose())
  t.equal(constructorCount, 2)

  t.end()
})

test('container with 1 singleton dependency', t => {
  let container = new Pojo()
  let constructorCount = 0
  let disposeCount = 0
  let dependencyObject = {price: 123, dispose: () => disposeCount++ }
  let factoryResult = merge(true, dependencyObject, {})

  let factory = () => {
    constructorCount++
    return merge.recursive(true, dependencyObject, {})
  }

  container.addDependency(factory, {name: 'my-dep', scope: 'singleton'})

  t.deepEqual(container.getObject('my-dep'), factoryResult)
  t.deepEqual(container.getAllObjects('my-dep'), [factoryResult])

  container.dispose()
  t.equal(disposeCount, 1)
  t.throws(() => container.dispose())
  t.equal(constructorCount, 1)

  t.end()
})

test('container child with own config', t => {
  let container = new Pojo({parentValue1: 'a', parentValue2: 'b'})

  t.equal(container.getConfigValue('parentValue1', 'a'))
  t.equal(container.getConfigValue('parentValue2', 'b'))

  let childContainer = container.createChild({'parentValue2': 'c'})

  t.equal(container.getConfigValue('parentValue1', 'a'))
  t.equal(container.getConfigValue('parentValue2', 'c'))

  t.end()
})
