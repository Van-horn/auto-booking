import { useEffect, useState } from 'react';

import { setMobifitTokenSecret } from '@/shared/api/github-api';
import { getGithubToken, setGithubToken } from '@/shared/lib/github-token';
import { getAuthToken, setAuthToken } from '@/shared/lib/mobifit-token';

export function SettingsScreen() {
  const [githubToken, setGithubTokenState] = useState('');
  const [githubSavedNote, setGithubSavedNote] = useState('');

  const [token, setToken] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  useEffect(() => {
    const storedGithub = getGithubToken();
    if (storedGithub) setGithubTokenState(storedGithub);

    const stored = getAuthToken();
    if (stored) setToken(stored);
  }, []);

  const onSaveGithubToken = () => {
    setGithubToken(githubToken.trim());
    setGithubSavedNote('Сохранено в этом браузере');
    setTimeout(() => setGithubSavedNote(''), 1500);
  };

  const onSave = async () => {
    const trimmed = token.trim();
    setAuthToken(trimmed);
    setIsSaving(true);
    setSavedNote('');
    try {
      await setMobifitTokenSecret(trimmed);
      setSavedNote('Сохранено и отправлено в GitHub Actions');
    } catch {
      setSavedNote('Сохранено локально, но не удалось отправить в GitHub Actions — проверьте GitHub токен выше');
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
      <h1 className="screen-title">GitHub токен</h1>
      <p className="status-text">
        Управляет пайплайном (пауза, логи, отправка токена ниже в GitHub Actions). Хранится только в этом браузере.
      </p>

      <textarea
        value={githubToken}
        onChange={(e) => setGithubTokenState(e.target.value)}
        placeholder="ghp_… или github_pat_…"
        autoCapitalize="none"
        autoCorrect="off"
        className="input"
      />

      <button className="button" onClick={onSaveGithubToken}>
        Сохранить
      </button>

      {githubSavedNote ? <p className="saved-note">{githubSavedNote}</p> : null}

      <div className="divider" />

      <h1 className="screen-title">Токен авторизации mobifitness</h1>

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
