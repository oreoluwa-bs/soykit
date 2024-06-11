import { Inter } from "next/font/google";
import { Socket } from "socket.io-client";
import { useState } from "react";
import useWebsocket from "@/hooks/useWebsocket";

const inter = Inter({ subsets: ["latin"] });

const messageEmitEvents = {
  SEND_MESSAGE: "sendDaoMessage",
  SEND_MESSAGE_REPLY: "sendDaoMessageReply",
  SEARCH_MESSAGE: "searchDaoMessage",
} as const;

type GroupMessage = {
  id: string | number;
  body: string;
};

function onNewMesssage(key: string, socket: Socket) {
  return new Promise<GroupMessage | null>((resolve) => {
    let newMessage: GroupMessage | null = null;

    socket.on(key, function (data: GroupMessage & { timeStamp: string }) {
      if (!data) {
        resolve(newMessage);

        return;
      }

      const formatData: GroupMessage = {
        ...data,
      };

      newMessage = formatData;
      resolve(newMessage);
    });
  });
}

export default function Home() {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const { socket, reconnecting } = useWebsocket({
    url: "https://localhost"!,
    onConnect,
  });
  const eventKey = "EVENT_KEY"; // PROJECT ID;

  function onConnect(socket: Socket | null) {
    if (!socket) return;

    onNewMesssage(eventKey, socket).then((newMessage) => {
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });
  }

  const sendMessage = (data: { message: string }) => {
    // const isReply = Boolean(data.parent);

    // const emitKey = isReply
    //   ? messageEmitEvents.SEND_MESSAGE_REPLY
    //   : messageEmitEvents.SEND_MESSAGE;
    const emitKey = messageEmitEvents.SEND_MESSAGE;

    socket?.emit(emitKey, {
      from: "ME",
      to: eventKey,
      // projectId: project.id,
      type: "text",
      body: data.message,
      // file: data.files,
      // tags: data.mentionedUserIds ?? [],

      // ...(isReply ? { parent: data.parent } : {}),
    });
  };

  return (
    <main className="max-w-screen-md  mx-auto py-6 px-10">
      <div className="space-y-5">
        {messages.map((message) => {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: message.body }}
              key={message.id}
              className="border rounded-sm"
            ></div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const formDaata = new FormData(e.target as HTMLFormElement);

          sendMessage({ message: formDaata.get("message") as string });
        }}
        className="mt-8"
      >
        <textarea
          className="w-full rounded-md border"
          name="message"
          id="message"
        />

        <button>Send</button>
      </form>
    </main>
  );
}
