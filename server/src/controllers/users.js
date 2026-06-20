const { validationResult } = require("express-validator");
const User = require("../models/User");

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("following", "username name avatar")
      .populate("followers", "username name avatar")
      .populate({
        path: "stories",
        select: "title description coverImage views likes",
        options: { sort: { createdAt: -1 } },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Follow/Unfollow user
// @route   PUT /api/users/:id/follow
// @access  Private
exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message: "Users cannot follow themselves",
      });
    }

    const userToFollow = await User.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const followingIndex = user.following.indexOf(req.params.id);
    const followerIndex = userToFollow.followers.indexOf(req.user.id);

    if (followingIndex === -1) {
      // Follow
      user.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);
    } else {
      // Unfollow
      user.following.splice(followingIndex, 1);
      userToFollow.followers.splice(followerIndex, 1);
    }

    await user.save();
    await userToFollow.save();

    res.json({
      success: true,
      following: user.following,
      followers: userToFollow.followers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "username name avatar bio"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      followers: user.followers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "username name avatar bio"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      following: user.following,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
