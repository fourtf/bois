import { Writable, writable } from "svelte/store";

export function localStorageWritable<T>(
  key: string,
  startValue: T
): Writable<T> {
  const json = localStorage.getItem(key);
  let store: Writable<T>;

  try {
    if (json) {
      store = writable(JSON.parse(json));
    } else {
      store = writable(startValue);
    }
  } catch {
    writable(startValue);
  }

  store.subscribe((val) => localStorage.setItem(key, JSON.stringify(val)));

  return store;
}
