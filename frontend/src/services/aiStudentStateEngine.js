let currentState = null;

export function setState(state) {
  currentState = state;
  return currentState;
}

export function getState() {
  return currentState;
}

export function clearState() {
  currentState = null;
}
