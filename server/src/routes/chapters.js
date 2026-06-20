const express = require("express");
const { check } = require("express-validator");
const {
  createChapter,
  getChapters,
  getChapter,
  updateChapter,
  deleteChapter,
} = require("../controllers/chapters");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getChapters)
  .post(
    protect,
    [
      check("title", "Title is required").not().isEmpty(),
      check("content", "Content is required").not().isEmpty(),
      check("chapterNumber", "Chapter number is required").isNumeric(),
    ],
    createChapter
  );

router
  .route("/:id")
  .get(getChapter)
  .put(protect, updateChapter)
  .delete(protect, deleteChapter);

module.exports = router;
