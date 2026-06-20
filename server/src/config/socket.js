const { Server } = require("socket.io");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle user authentication
    socket.on("authenticate", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          connectedUsers.set(socket.id, user._id);
          socket.join(`user_${user._id}`); // Private user channel
          console.log(`User ${user.username} authenticated`);
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    });

    // Handle joining story rooms
    socket.on("join_story", (storyId) => {
      socket.join(`story_${storyId}`);
      console.log(`Socket ${socket.id} joined story ${storyId}`);
    });

    // Handle joining chapter rooms
    socket.on("join_chapter", (chapterId) => {
      socket.join(`chapter_${chapterId}`);
      console.log(`Socket ${socket.id} joined chapter ${chapterId}`);
    });

    // Handle new comment
    socket.on("new_comment", async (data) => {
      try {
        const { chapterId, content, parentComment } = data;
        const userId = connectedUsers.get(socket.id);

        if (!userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const comment = await Comment.create({
          content,
          author: userId,
          chapter: chapterId,
          parentComment,
        });

        await comment.populate("author", "username name avatar");

        // Broadcast to all users in the chapter room
        io.to(`chapter_${chapterId}`).emit("comment_added", comment);
      } catch (error) {
        console.error("New comment error:", error);
        socket.emit("error", { message: "Failed to create comment" });
      }
    });

    // Handle typing indicator
    socket.on("typing_start", (chapterId) => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        socket.to(`chapter_${chapterId}`).emit("user_typing", { userId });
      }
    });

    socket.on("typing_end", (chapterId) => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        socket
          .to(`chapter_${chapterId}`)
          .emit("user_stopped_typing", { userId });
      }
    });

    // Handle notifications
    function sendNotification(userId, notification) {
      io.to(`user_${userId}`).emit("notification", notification);
    }

    // Handle disconnect
    socket.on("disconnect", () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  return {
    io,
    sendNotification, // Export for use in other parts of the application
  };
}

module.exports = initializeSocket;
