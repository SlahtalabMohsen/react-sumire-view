import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X } from "lucide-react";
import { useSocket } from "../contexts/SocketContext";

interface NotificationItemProps {
  notification: {
    type: string;
    timestamp: Date;
    data: any;
  };
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
}) => {
  const getMessage = () => {
    switch (notification.type) {
      case "new_follower":
        return `${notification.data.follower.name} started following you`;
      case "new_like":
        return `${notification.data.liker.name} liked your story "${notification.data.story.title}"`;
      case "new_comment":
        return `${notification.data.commenter.name} commented on your story "${notification.data.story.title}"`;
      case "new_chapter":
        return `${notification.data.author.name} published chapter ${notification.data.chapterNumber} of "${notification.data.story.title}"`;
      default:
        return "New notification";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fantasy-card p-4 mb-2 flex items-start gap-3"
    >
      <div className="fantasy-glow flex items-center gap-2 flex-1">
        <Bell className="w-5 h-5" />
        <div>
          <p className="text-sm">{getMessage()}</p>
          <p className="text-xs opacity-60">
            {new Date(notification.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const NotificationsPanel: React.FC = () => {
  const { notifications, clearNotifications } = useSocket();

  return (
    <div className="fixed top-16 right-4 z-50 w-80 max-h-[80vh] overflow-y-auto">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <NotificationItem
            key={index}
            notification={notification}
            onClose={() => {
              const newNotifications = [...notifications];
              newNotifications.splice(index, 1);
              clearNotifications();
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
