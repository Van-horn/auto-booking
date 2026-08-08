import { useEffect, useState } from 'react';

import { setMobifitTokenSecret } from '@/shared/api/github-api';
import { getAuthToken, setAuthToken } from '@/shared/lib/mobifit-token';

export function SettingsScreen() {
  const [token, setToken] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  useEffect(() => {
    const stored = getAuthToken();
    if (stored) setToken(stored);
  }, []);

  const onSave = async () => {
    const trimmed = token.trim();
    setAuthToken(trimmed);
    setIsSaving(true);
    setSavedNote('');
    try {
      await setMobifitTokenSecret(trimmed);
      setSavedNote('Сохранено и отправлено в GitHub Actions');
    } catch {
      setSavedNote('Сохранено локально, но не удалось отправить в GitHub Actions');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavedNote(''), 3000);
    }
  };

  const onSendNotification = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('Уведомление', { body: notificationText.trim() });
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') new Notification('Уведомление', { body: notificationText.trim() });
    });
  };

  return (
    <div className="screen">
      <h1 className="screen-title">Токен авторизации</h1>

      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Authorization token"
        autoCapitalize="none"
        autoCorrect="off"
        className="input"
      />

      <button className="button" onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Сохранение…' : 'Сохранить'}
      </button>

      {savedNote ? <p className="saved-note">{savedNote}</p> : null}

      <div className="divider" />

      <h1 className="screen-title">Ручное уведомление</h1>

      <textarea
        value={notificationText}
        onChange={(e) => setNotificationText(e.target.value)}
        placeholder="Текст уведомления"
        className="input"
      />

      <button className="button" onClick={onSendNotification}>
        Отправить
      </button>
    </div>
  );
}
