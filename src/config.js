import merge from 'merge'

export default class Config {
  constructor(data) {
    this.data = data || {}
  }

  get(key) {
    let value = this.data[key]
    if (value === undefined) {
      throw new Error('Unknown configuration key "' + key + '".')
    }
    if (value === null) {
      throw new Error('Configuration key "' + key + '" has null as value.')
    }
    return value
  }

  add(data) {
    merge.recursive(this.data, data)
  }

  addValue(key, value) {
    this.add({[key]: value})
  }
}
