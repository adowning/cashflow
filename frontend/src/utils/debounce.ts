export function debounce(fn, wait) {
  let timer;
  return function(...args) {
    if (timer) {
      clearTimeout(timer); // Clear any pre-existing timer
    }
    const context = this; // Get the current context
    timer = setTimeout(() => {
      fn.apply(context, args); // Call the function if time expires
    }, wait);
  };
}