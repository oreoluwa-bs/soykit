import { useEffect, useRef, useState } from "react";
import { Manager, Socket } from "socket.io-client";

export enum SocketReadyState {
  CONNECTING = "CONNECTING",
  OPEN = "OPEN",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
}

interface UseWebsocketProps {
  url: string;
  onConnect?: (socket: Socket | null) => void;
  onClose?: () => void;
}

export default function useWebsocket({
  url,
  onConnect,
  onClose,
}: UseWebsocketProps) {
  const [reconnecting, setReconnecting] = useState(false);
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    const manager = new Manager(url);
    socket.current = manager.socket("/");

    socket.current?.on("connect", function () {
      // console.log("connected");
      onConnect?.(socket.current);
      setReconnecting(false);
    });

    socket.current?.on("disconnect", function (reason) {
      // console.log("closed");
      if (socket.current && reason === "io server disconnect") {
        if (reconnecting) return;

        socket.current?.connect();
        setReconnecting(true);

        // setTimeout(function () {
        //   setReconnecting(false);
        // }, 2000);
      }

      onClose?.();
    });

    if (process.env.NODE_ENV === "development") {
      socket.current.on("error", function (d) {
        console.log("error: ", d);
      });

      socket.current.on("reconnect_error", (d) => {
        console.log("R", d);
      });
      socket.current.on("ping", (d) => {
        console.log("PING", d);
      });
    }

    return () => {
      socket.current?.close();
      socket.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnecting, url]);

  return {
    socket: socket.current,
    reconnecting,
  };
}
