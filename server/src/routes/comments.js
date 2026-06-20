const express = require("express");
const { check } = require("express-validator");
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleLike,
} = require("../controllers/comments");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getComments)
  .post(
    protect,
    [check("content", "Comment content is required").not().isEmpty()],
    createComment
  );

router.route("/:id").put(protect, updateComment).delete(protect, deleteComment);

router.put("/:id/like", protect, toggleLike);

module.exports = router;
