import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendLocalNotification } from '@/features/auto-booking/lib/notify';
import { getAuthToken, setAuthToken } from '@/shared/lib/secure-token';
import { AppText } from '@/shared/ui/app-text';

export function SettingsScreen() {
  const [token, setToken] = useState('');
  const [savedNote, setSavedNote] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  useEffect(() => {
    (async () => {
      const stored = await getAuthToken();
      if (stored) setToken(stored);
    })();
  }, []);

  const onSave = async () => {
    await setAuthToken(token.trim());
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1500);
  };

  const onSendNotification = () => {
    sendLocalNotification('Уведомление', notificationText.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText bold style={styles.header}>
          Токен авторизации
        </AppText>

        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="Authorization token"
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={onSave}>
          <AppText style={styles.buttonText}>Сохранить</AppText>
        </Pressable>

        {savedNote ? <AppText style={styles.savedNote}>Сохранено</AppText> : null}

        <View style={styles.divider} />

        <AppText bold style={styles.header}>
          Ручное уведомление
        </AppText>

        <TextInput
          value={notificationText}
          onChangeText={setNotificationText}
          placeholder="Текст уведомления"
          multiline
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={onSendNotification}>
          <AppText style={styles.buttonText}>Отправить</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    fontSize: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  savedNote: {
    fontSize: 13,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#000000',
  },
});
