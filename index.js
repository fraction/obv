module.exports = function (filter) {
  var value = null, listeners = [], oncers = []

  function trigger (_value) {
    const isUnchanged = () => value === _value
    const rm = () => listeners.splice(i, 1)
    const listenersClone = [...listeners]

    value = _value
    var length = listenersClone.length

    for(var i = 0; i< length && isUnchanged(); i++) {
      const ready = listenersClone[i]
      if (typeof ready === 'function') {
        ready(value, rm)
      }
      //if we remove a listener, must decrement i also
    }
    // decrement from length, incase a !immediately
    // listener is added during a trigger
    var l = oncers.length
    var _oncers = oncers
    oncers = []
    while(l-- && isUnchanged()) {
      _oncers.shift()(value)
    }
  }

  function many (ready, immediately) {
    function rm () { //manually remove...
      //fast path, will happen if an earlier listener has not been removed.
      if(listeners[i] !== ready) {
        i = listeners.indexOf(ready)
      }
      listeners.splice(i, 1)
    }

    var i = listeners.push(ready) - 1

    if(value !== null && immediately !== false) ready(value, rm)

    return rm
  }

  many.set = function (_value) {
    if(filter ? filter(value, _value) : true) trigger(many.value = _value)
    return many
  }

  many.once = function (once, immediately) {
    if(value !== null && immediately !== false) {
      once(value)
      return function () {}
    }
    else {
      var i = oncers.push(once) - 1
      return function () {
        if(oncers[i] !== once)
          i = oncers.indexOf(once)
      }
    }
  }

  return many
}


