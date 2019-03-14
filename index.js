const noop = () => {}
const isFunction = x => typeof x === 'function'

module.exports = (filter) => {
  // First we define an array of functions to call when the value of the
  // observable changes. This is one of two components that maintain state.
  let listeners = []

  // The obv() function is the default function that registers an observable
  // and runs it immediately by default (so long as `obv.value !== null`).
  //
  // This can also be overridden by setting the `immediate` argument to a
  // falsey value, as it defaults to `true`.
  const obv = (listener, immediate) => {
    listeners.push(listener)

    if (obv.value !== null && immediate !== false) {
      listener(obv.value, rm(listener))
    }

    return rm(listener)
  }

  // The `obv.value` property is the only other component that maintains state.
  // It's the best way of finding the current state of the observable.
  obv.value = null

  // We often want to remove a listener that we've registered, so this function
  // takes a listener as input and returns a function that sets the listener
  // from the `listeners` array to `null`. We'll want to garbage-collect those
  // `null` values later.
  const rm = (listener) => () => {
    const listenerIndex = listeners.indexOf(listener)
    if (listenerIndex >= 0) {
      listeners[listenerIndex] = null
    }
  }

  // Sometimes we just want to run a listener once. In these cases, the simple
  // option is to patch the listener and then either:
  //
  // - run it immeditely, or
  // - patch the listener so that it immediately removes itself
  //
  // We use `noop` extensively here because there's no use passing `rm` for a
  // function that only runs once.
  obv.once = (listener, immediate) => {
    if (obv.value !== null && immediate !== false) {
      listener(obv.value, noop)
    } else {
      // patch listener to auto-remove itself
      const patchedListener = (value, rm) => {
        rm()
        listener(value, noop)
      }
      listeners.push(patchedListener)
    }

    return noop
  }

  // What happens when the value changes? We want to make sure that we trigger
  // *all* of the listeners, deleting any `null` entries in the array that were
  // left behind by `rm()` calls.
  const trigger = () => {
    const initialValue = obv.value
    const isValueUnchanged = () => obv.value === initialValue

    listeners.forEach((listener) => {
      if (isFunction(listener) && isValueUnchanged()) {
        listener(initialValue, rm(listener))
      }
    })


    if (isValueUnchanged()) {
      const activeListeners = listeners.filter(isFunction)
      listeners = activeListeners
    }
  }

  // Now for the finale: how do we set a value? This modifies the state to set
  // `obv.value` and then runs the `trigger()` function from above.
  obv.set = (newValue) => {
    if (typeof filter === 'function' ? filter(obv.value, newValue) : true) {
      obv.value = newValue
      trigger()
    }

    return obv
  }

  return obv
}
