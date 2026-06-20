const { validationResult } = require("express-validator");
const Story = require("../models/Story");
const Chapter = require("../models/Chapter");

// @desc    Create new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, genre, tags } = req.body;

    const story = await Story.create({
      title,
      description,
      genre,
      tags,
      author: req.user.id,
    });

    res.status(201).json({
      success: true,
      story,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get all stories (with pagination)
// @route   GET /api/stories
// @access  Public
exports.getStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Story.countDocuments();
    const stories = await Story.find()
      .populate("author", "username name avatar")
      .sort("-createdAt")
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: stories.length,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
      stories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Public
exports.getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("author", "username name avatar")
      .populate({
        path: "chapters",
        match: { status: "published" },
        select: "title chapterNumber publishedAt",
        options: { sort: { chapterNumber: 1 } },
      });

    if (!story) {
      return res.status(404).json({
        message: "Story not found",
      });
    }

    // Increment views
    story.views += 1;
    await story.save();

    res.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private
exports.updateStory = async (req, res) => {
  try {
    let story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found",
      });
    }

    // Make sure user owns story
    if (story.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to update this story",
      });
    }

    story = await Story.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found",
      });
    }

    // Make sure user owns story
    if (story.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to delete this story",
      });
    }

    // Delete all chapters associated with the story
    await Chapter.deleteMany({ story: story._id });

    // Delete the story
    await story.remove();

    res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Like/Unlike story
// @route   PUT /api/stories/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found",
      });
    }

    const likeIndex = story.likes.indexOf(req.user.id);

    if (likeIndex === -1) {
      // Like
      story.likes.push(req.user.id);
    } else {
      // Unlike
      story.likes.splice(likeIndex, 1);
    }

    await story.save();

    res.json({
      success: true,
      likes: story.likes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
