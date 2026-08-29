// React 19+ requires IS_REACT_ACT_ENVIRONMENT to be true so that
// synchronous act() calls do not warn at runtime.
// See https://react.dev/reference/react/act#act
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
