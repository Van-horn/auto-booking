import { useEffect, useState } from 'react';

import { setMobifitTokenSecret } from '@/shared/api/github-api';
import { getGithubToken, setGithubToken } from '@/shared/lib/github-token';
import { getAuthToken, setAuthToken } from '@/shared/lib/mobifit-token';

function TokenField({ label, hint, placeholder, storedValue, onSave, savedNote }) {
  const [value, setValue] = useState('');
  const [isEditing, setIsEditing] = useState(!storedValue);

  useEffect(() => {
    setIsEditing(!storedValue);
  }, [storedValue]);

  const onSubmit = async () => {
    await onSave(value.trim());
    setValue('');
    setIsEditing(false);
  };

  return (
    <>
      <h1 className="screen-title">{label}</h1>
      {hint ? <p className="status-text">{hint}</p> : null}

      {isEditing ? (
        <>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoCapitalize="none"
            autoCorrect="off"
            className="input"
          />
          <button className="button" onClick={onSubmit}>
            Сохранить
          </button>
        </>
      ) : (
        <>
          <p className="status-text">•••••••••• (сохранён)</p>
          <button className="button" onClick={() => setIsEditing(true)}>
            Изменить
          </button>
        </>
      )}

      {savedNote ? <p className="saved-note">{savedNote}</p> : null}
    </>
  );
}

export function SettingsScreen() {
  const [githubToken, setGithubTokenValue] = useState(undefined);
  const [githubSavedNote, setGithubSavedNote] = useState('');

  const [mobifitToken, setMobifitTokenValue] = useState(undefined);
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    setGithubTokenValue(getGithubToken());
    setMobifitTokenValue(getAuthToken());
  }, []);

  const onSaveGithubToken = (value) => {
    setGithubToken(value);
    setGithubTokenValue(value);
    setGithubSavedNote('Сохранено в этом браузере');
    setTimeout(() => setGithubSavedNote(''), 1500);
  };

  const onSaveMobifitToken = async (value) => {
    setAuthToken(value);
    setMobifitTokenValue(value);
    try {
      await setMobifitTokenSecret(value);
      setSavedNote('Сохранено и отправлено в GitHub Actions');
    } catch {
      setSavedNote('Сохранено локально, но не удалось отправить в GitHub Actions — проверьте GitHub токен выше');
    } finally {
      setTimeout(() => setSavedNote(''), 3000);
    }
  };

  if (githubToken === undefined || mobifitToken === undefined) return null;

  return (
    <div className="screen">
      <TokenField
        label="GitHub токен"
        hint="Управляет пайплайном (пауза, логи, отправка токена ниже в GitHub Actions). Хранится только в этом браузере."
        placeholder="ghp_… или github_pat_…"
        storedValue={githubToken}
        onSave={onSaveGithubToken}
        savedNote={githubSavedNote}
      />

      <div className="divider" />

      <TokenField
        label="Токен авторизации mobifitness"
        placeholder="Authorization token"
        storedValue={mobifitToken}
        onSave={onSaveMobifitToken}
        savedNote={savedNote}
      />
    </div>
  );
}
