import { useEffect, useRef, useState } from "react";

export function useWebSocket() {
  const ws = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => setConnected(true);

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch {}
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    };

    connect();
    return () => ws.current?.close();
  }, []);

  return { lastMessage, connected };
}
