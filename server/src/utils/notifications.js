const User = require("../models/User");

async function createNotification(type, userId, data) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const notification = {
      type,
      timestamp: new Date(),
      read: false,
      ...data,
    };

    // Add notification to user's notifications array
    user.notifications = user.notifications || [];
    user.notifications.unshift(notification);

    // Limit notifications to last 50
    if (user.notifications.length > 50) {
      user.notifications = user.notifications.slice(0, 50);
    }

    await user.save();

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Notification types
const notificationTypes = {
  NEW_FOLLOWER: "new_follower",
  NEW_LIKE: "new_like",
  NEW_COMMENT: "new_comment",
  NEW_CHAPTER: "new_chapter",
  STORY_UPDATE: "story_update",
  MENTION: "mention",
};

// Notification handlers
const notificationHandlers = {
  [notificationTypes.NEW_FOLLOWER]: async (
    socket,
    { followerId, followedId }
  ) => {
    const follower = await User.findById(followerId).select(
      "username name avatar"
    );
    const notification = await createNotification(
      notificationTypes.NEW_FOLLOWER,
      followedId,
      {
        follower: {
          id: follower._id,
          username: follower.username,
          name: follower.name,
          avatar: follower.avatar,
        },
      }
    );
    socket.to(`user_${followedId}`).emit("notification", notification);
  },

  [notificationTypes.NEW_LIKE]: async (
    socket,
    { likerId, authorId, storyId, storyTitle }
  ) => {
    const liker = await User.findById(likerId).select("username name avatar");
    const notification = await createNotification(
      notificationTypes.NEW_LIKE,
      authorId,
      {
        liker: {
          id: liker._id,
          username: liker.username,
          name: liker.name,
          avatar: liker.avatar,
        },
        story: {
          id: storyId,
          title: storyTitle,
        },
      }
    );
    socket.to(`user_${authorId}`).emit("notification", notification);
  },

  [notificationTypes.NEW_COMMENT]: async (
    socket,
    { commenterId, authorId, chapterId, storyId, storyTitle }
  ) => {
    const commenter = await User.findById(commenterId).select(
      "username name avatar"
    );
    const notification = await createNotification(
      notificationTypes.NEW_COMMENT,
      authorId,
      {
        commenter: {
          id: commenter._id,
          username: commenter.username,
          name: commenter.name,
          avatar: commenter.avatar,
        },
        story: {
          id: storyId,
          title: storyTitle,
        },
        chapter: chapterId,
      }
    );
    socket.to(`user_${authorId}`).emit("notification", notification);
  },

  [notificationTypes.NEW_CHAPTER]: async (
    socket,
    { authorId, followers, storyId, storyTitle, chapterNumber }
  ) => {
    for (const followerId of followers) {
      const notification = await createNotification(
        notificationTypes.NEW_CHAPTER,
        followerId,
        {
          story: {
            id: storyId,
            title: storyTitle,
          },
          chapterNumber,
          author: {
            id: authorId,
          },
        }
      );
      socket.to(`user_${followerId}`).emit("notification", notification);
    }
  },
};

module.exports = {
  createNotification,
  notificationTypes,
  notificationHandlers,
};
