const express = require("express");
const { check } = require("express-validator");
const {
  createStory,
  getStories,
  getStory,
  updateStory,
  deleteStory,
  toggleLike,
} = require("../controllers/stories");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Re-route into chapter routes
router.use("/:storyId/chapters", require("./chapters"));

router
  .route("/")
  .get(getStories)
  .post(
    protect,
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("genre", "Genre is required").not().isEmpty(),
    ],
    createStory
  );

router
  .route("/:id")
  .get(getStory)
  .put(protect, updateStory)
  .delete(protect, deleteStory);

router.put("/:id/like", protect, toggleLike);

module.exports = router;
