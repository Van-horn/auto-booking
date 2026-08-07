import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateTime, formatWeekday } from '@/entities/training/lib/format';
import { useAutoBookingStatus } from '@/features/auto-booking/model/use-auto-booking-status';
import { AppText } from '@/shared/ui/app-text';

export function HomeScreen() {
  const { isLoading, hasToken, error, nextDayTrainings, pausedMatch, pauseTraining } = useAutoBookingStatus();

  const onPause = (match) => {
    Alert.alert(
      'Пропустить автозапись?',
      `${match.rule.title} — ${formatDateTime(match.entry.datetime)}`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Пропустить', style: 'destructive', onPress: () => pauseTraining(match.entry.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText bold style={styles.header}>
          Автозапись
        </AppText>

        {hasToken === false ? <AppText style={styles.status}>Необходим токен</AppText> : null}

        {hasToken ? (
          <>
            {pausedMatch ? (
              <AppText style={styles.pausedNote}>
                Приостановлено: {pausedMatch.rule.title} ({formatDateTime(pausedMatch.entry.datetime)})
              </AppText>
            ) : null}

            {isLoading ? <AppText style={styles.status}>Загрузка…</AppText> : null}

            {error ? (
              <AppText style={styles.status}>Не удалось загрузить расписание</AppText>
            ) : null}

            {!isLoading && !error && nextDayTrainings.length > 0
              ? nextDayTrainings.map((match) => (
                  <View key={match.entry.id} style={styles.card}>
                    <AppText bold style={styles.cardTitle}>
                      {match.rule.title} ({formatWeekday(match.rule)})
                    </AppText>

                    <Pressable style={styles.button} onPress={() => onPause(match)}>
                      <AppText style={styles.buttonText}>Пропустить один раз</AppText>
                    </Pressable>
                  </View>
                ))
              : null}

            {!isLoading && !error && nextDayTrainings.length === 0 ? (
              <AppText style={styles.status}>Нет предстоящих тренировок для автозаписи на этой неделе</AppText>
            ) : null}
          </>
        ) : null}
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
  status: {
    fontSize: 14,
    color: '#666666',
  },
  pausedNote: {
    fontSize: 13,
    color: '#666666',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
  },
  button: {
    marginTop: 10,
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
});
