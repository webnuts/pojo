import merge from 'merge'

export default class Config {
  constructor(data) {
    this.data = data || {}
  }

  try(...keys) {
    if (keys.length === 0) {
      return merge(true, this.data, {})
    } else if (keys.length === 1) {
      return this.data[keys[0]]
    } else {
      return keys.map(key => this.data[key])
    }
  }

  get(...keys) {
    if (keys.length === 0) {
      return merge(true, this.data, {})
    } else {
      let result = keys.map(key => {
        let value = this.data[key]
        if (value === undefined) {
          throw new Error('Unknown configuration key "' + key + '".')
        }
        if (value === null) {
          throw new Error('Configuration key "' + key + '" has null as value.')
        }
        return value
      })
      if (keys.length === 1) {
        return result[0]
      } else {
        return result
      }
    }
  }

  add(data) {
    merge.recursive(this.data, data)
  }

  addValue(key, value) {
    this.add({[key]: value})
  }
}
