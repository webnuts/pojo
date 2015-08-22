import merge from 'merge'

export default class Config {
  constructor(data) {
    this.data = data || {}
  }

  try(...keys) {
    if (keys.length === 0) {
      return merge(true, {}, this.data)
    } else if (keys.length === 1) {
      return this.data[keys[0]]
    } else {
      return keys.reduce((result, key) => {
        result[key] = this.data[key]
        return result
      }, {})
    }
  }

  tryOrDefault(defaultValue, ...keys) {
    let result = this.try.apply(this, keys)
    return result == null ? defaultValue : result
  }

  get(...keys) {
    if (keys.length === 0) {
      return merge(true, this.data, {})
    } else {
      let result = keys.reduce((result, key) => {
        let value = this.data[key]
        if (value === undefined) {
          throw new Error('Unknown configuration key "' + key + '".')
        }
        if (value === null) {
          throw new Error('Configuration key "' + key + '" has null as value.')
        }
        result[key] = value
        return result
      }, {})
      if (keys.length === 1) {
        return result[keys[0]]
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
