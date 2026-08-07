import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearLogs, getLogs, markLogsRead } from '@/features/auto-booking/lib/logs-store';
import { setBadgeCount } from '@/features/auto-booking/lib/notify';
import { AppText } from '@/shared/ui/app-text';

const LEVEL_LABEL = {
  error: 'Ошибка',
  warning: 'Внимание',
  success: 'Готово',
};

export function LogsScreen() {
  const [logs, setLogs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLogs(await getLogs());
        await markLogsRead();
        await setBadgeCount(0);
      })();
    }, [])
  );

  const onClear = async () => {
    await clearLogs();
    setLogs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <AppText bold style={styles.header}>
          Логи
        </AppText>
        <Pressable onPress={onClear}>
          <AppText style={styles.clearButton}>Очистить</AppText>
        </Pressable>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<AppText style={styles.empty}>Записей нет</AppText>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <AppText style={[styles.level, styles[`level_${item.level}`]]}>
              {LEVEL_LABEL[item.level] ?? item.level}
            </AppText>
            <AppText style={styles.rowTitle}>{item.title}</AppText>
            <AppText style={styles.rowMessage}>{item.message}</AppText>
            <AppText style={styles.rowTime}>{new Date(item.timestamp).toLocaleString('ru-RU')}</AppText>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    fontSize: 22,
  },
  clearButton: {
    fontSize: 14,
    color: '#666666',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  empty: {
    fontSize: 14,
    color: '#666666',
    marginTop: 20,
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  level: {
    fontSize: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  level_error: {
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  level_warning: {
    backgroundColor: '#e5e5e5',
    color: '#000000',
  },
  level_success: {
    backgroundColor: '#ffffff',
    color: '#666666',
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  rowTitle: {
    fontSize: 15,
  },
  rowMessage: {
    fontSize: 13,
    color: '#333333',
  },
  rowTime: {
    fontSize: 11,
    color: '#999999',
  },
});
