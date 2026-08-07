import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJSON(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key) {
  return AsyncStorage.removeItem(key);
}
