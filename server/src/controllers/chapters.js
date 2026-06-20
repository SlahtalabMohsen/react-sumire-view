const { validationResult } = require("express-validator");
const Chapter = require("../models/Chapter");
const Story = require("../models/Story");

// @desc    Create new chapter
// @route   POST /api/stories/:storyId/chapters
// @access  Private
exports.createChapter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({
        message: "Story not found",
      });
    }

    // Make sure user owns story
    if (story.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to add chapters to this story",
      });
    }

    const { title, content, chapterNumber } = req.body;

    const chapter = await Chapter.create({
      title,
      content,
      chapterNumber,
      story: req.params.storyId,
      author: req.user.id,
    });

    // Add chapter to story
    story.chapters.push(chapter._id);
    await story.save();

    res.status(201).json({
      success: true,
      chapter,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get all chapters of a story
// @route   GET /api/stories/:storyId/chapters
// @access  Public
exports.getChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find({ story: req.params.storyId })
      .populate("author", "username name avatar")
      .sort("chapterNumber");

    res.json({
      success: true,
      count: chapters.length,
      chapters,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get single chapter
// @route   GET /api/chapters/:id
// @access  Public
exports.getChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate("author", "username name avatar")
      .populate("story", "title");

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found",
      });
    }

    // Increment views
    chapter.views += 1;
    await chapter.save();

    res.json({
      success: true,
      chapter,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Update chapter
// @route   PUT /api/chapters/:id
// @access  Private
exports.updateChapter = async (req, res) => {
  try {
    let chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found",
      });
    }

    // Make sure user owns chapter
    if (chapter.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to update this chapter",
      });
    }

    // If status is being changed to published, set publishedAt
    if (req.body.status === "published" && chapter.status !== "published") {
      req.body.publishedAt = Date.now();
    }

    chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      chapter,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Delete chapter
// @route   DELETE /api/chapters/:id
// @access  Private
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found",
      });
    }

    // Make sure user owns chapter
    if (chapter.author.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to delete this chapter",
      });
    }

    // Remove chapter from story
    const story = await Story.findById(chapter.story);
    story.chapters = story.chapters.filter(
      (chId) => chId.toString() !== chapter._id.toString()
    );
    await story.save();

    // Delete the chapter
    await chapter.remove();

    res.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
