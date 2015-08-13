import merge from 'merge'

export default class Config {
  constructor(data) {
    this.data = data
  }

  get(key) {
    return this.data[key]
  }

  add(data) {
    merge.recursive(this.data, data)
  }

  addValue(key, value) {
    this.add({[key]: value})
  }

  createdNestedConfig(data) {
    return new Config(merge(true, this.data, data))
  }
}