const { validationResult } = require("express-validator");
const Comment = require("../models/Comment");
const Chapter = require("../models/Chapter");

// @desc    Create comment
// @route   POST /api/chapters/:chapterId/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chapter = await Chapter.findById(req.params.chapterId);

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found",
      });
    }

    const { content, parentComment } = req.body;

    const comment = await Comment.create({
      content,
      author: req.user.id,
      chapter: req.params.chapterId,
      parentComment,
    });

    // Add comment to chapter
    chapter.comments.push(comment._id);
    await chapter.save();

    // Populate author details
    await comment.populate("author", "username name avatar");

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get comments for a chapter
// @route   GET /api/chapters/:chapterId/comments
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      chapter: req.params.chapterId,
      parentComment: null, // Get only top-level comments
    })
      .populate("author", "username name avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username name avatar",
        },
      })
      .sort("-createdAt");

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    // Make sure user owns comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to update this comment",
      });
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true, runValidators: true }
    ).populate("author", "username name avatar");

    res.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    // Make sure user owns comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to delete this comment",
      });
    }

    // Remove comment from chapter
    const chapter = await Chapter.findById(comment.chapter);
    chapter.comments = chapter.comments.filter(
      (cId) => cId.toString() !== comment._id.toString()
    );
    await chapter.save();

    // Delete all replies
    await Comment.deleteMany({ parentComment: comment._id });

    // Delete the comment
    await comment.remove();

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Like/Unlike comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const likeIndex = comment.likes.indexOf(req.user.id);

    if (likeIndex === -1) {
      // Like
      comment.likes.push(req.user.id);
    } else {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    }

    await comment.save();

    res.json({
      success: true,
      likes: comment.likes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
