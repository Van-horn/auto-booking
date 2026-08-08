import { useCallback, useEffect, useState } from 'react';

import { clearLogs, fetchLogs } from '@/shared/api/github-api';

const LEVEL_LABEL = {
  error: 'Ошибка',
  warning: 'Внимание',
  success: 'Готово',
};

export function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLogs(await fetchLogs());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onClear = async () => {
    setIsLoading(true);
    try {
      await clearLogs();
      setLogs([]);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header-row">
        <h1 className="screen-title">Логи</h1>
        <button className="link-button" onClick={onClear}>
          Очистить
        </button>
      </div>

      {isLoading ? <p className="status-text">Загрузка…</p> : null}
      {error ? <p className="status-text">{error.message || 'Не удалось загрузить логи'}</p> : null}

      {!isLoading && !error && logs.length === 0 ? <p className="status-text">Записей нет</p> : null}

      <div className="list">
        {logs.map((item) => (
          <div key={item.id} className="row">
            <span className={`level level_${item.level}`}>{LEVEL_LABEL[item.level] ?? item.level}</span>
            <div className="row-title">{item.title}</div>
            <div className="row-message">{item.message}</div>
            <div className="row-time">{new Date(item.timestamp).toLocaleString('ru-RU')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
