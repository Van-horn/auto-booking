import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const isWeb = Platform.OS === 'web';

export async function getAuthToken() {
  try {
    if (isWeb) return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token) {
  if (isWeb) return AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  return SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  if (isWeb) return AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
