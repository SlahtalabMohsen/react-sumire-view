import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: Notification[];
  clearNotifications: () => void;
  sendComment: (
    chapterId: string,
    content: string,
    parentComment?: string
  ) => void;
  startTyping: (chapterId: string) => void;
  stopTyping: (chapterId: string) => void;
  joinStory: (storyId: string) => void;
  joinChapter: (chapterId: string) => void;
}

interface Notification {
  id: string;
  type: string;
  timestamp: Date;
  read: boolean;
  data: any;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  notifications: [],
  clearNotifications: () => {},
  sendComment: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  joinStory: () => {},
  joinChapter: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000",
      {
        autoConnect: false,
      }
    );

    // Connect event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);

      // Authenticate socket with JWT token
      const token = localStorage.getItem("token");
      if (token) {
        newSocket.emit("authenticate", token);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Handle notifications
    newSocket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Handle comments
    newSocket.on("comment_added", (comment) => {
      // Emit an event that components can listen to
      window.dispatchEvent(new CustomEvent("newComment", { detail: comment }));
    });

    // Handle typing indicators
    newSocket.on("user_typing", ({ userId }) => {
      window.dispatchEvent(
        new CustomEvent("userTyping", { detail: { userId } })
      );
    });

    newSocket.on("user_stopped_typing", ({ userId }) => {
      window.dispatchEvent(
        new CustomEvent("userStoppedTyping", { detail: { userId } })
      );
    });

    // Connect to socket
    newSocket.connect();

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const sendComment = (
    chapterId: string,
    content: string,
    parentComment?: string
  ) => {
    if (socket && connected) {
      socket.emit("new_comment", { chapterId, content, parentComment });
    }
  };

  const startTyping = (chapterId: string) => {
    if (socket && connected) {
      socket.emit("typing_start", chapterId);
    }
  };

  const stopTyping = (chapterId: string) => {
    if (socket && connected) {
      socket.emit("typing_end", chapterId);
    }
  };

  const joinStory = (storyId: string) => {
    if (socket && connected) {
      socket.emit("join_story", storyId);
    }
  };

  const joinChapter = (chapterId: string) => {
    if (socket && connected) {
      socket.emit("join_chapter", chapterId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        clearNotifications,
        sendComment,
        startTyping,
        stopTyping,
        joinStory,
        joinChapter,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
