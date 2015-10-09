import merge from 'merge'

function walk(obj, path) {
  if (path) {
    let keys = path.split('.')
    while (keys.length && obj !== undefined) {
      obj = obj[keys.shift()]
    }
  }
  return obj
}

export default class Config {
  constructor(data) {
    this.data = data || {}
  }

  try(...keys) {
    if (keys.length === 0) {
      return merge(true, {}, this.data)
    } else if (keys.length === 1) {
      return walk(this.data, keys[0])
      //return this.data[keys[0]]
    } else {
      return keys.reduce((result, key) => {
        result[key] = walk(this.data, key)
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
        let value = walk(this.data, key)
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

  has(key) {
    return walk(this.data, key) !== undefined
  }

  add(data) {
    merge.recursive(this.data, data)
  }

  addValue(key, value) {
    this.add({[key]: value})
  }
}
