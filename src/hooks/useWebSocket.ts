import { useEffect, useState, useCallback } from 'react';

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting');

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${url}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setStatus('open');
    ws.onclose = () => {
      setStatus('closed');
      setTimeout(connect, 3000); // Reconnect
    };
    ws.onmessage = (event) => {
      setLastMessage(JSON.parse(event.data));
    };

    return ws;
  }, [url]);

  useEffect(() => {
    const ws = connect();
    return () => ws.close();
  }, [connect]);

  return { lastMessage, status };
}
