uni.addInterceptor({
  returnValue(res) {
    if (!(!!res && (typeof res === 'object' || typeof res === 'function') && typeof res.then === 'function')) {
      return res
    }
    return new Promise((resolve, reject) => {
      res.then((val) => {
        if (!val) {
          resolve(val)
          return
        }
        if (val[0]) {
          reject(val[0])
        } else {
          resolve(val[1])
        }
      })
    })
  }
})
