const express = require("express");
const { check } = require("express-validator");
const {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
} = require("../controllers/users");
const { protect } = require("../middleware/auth");

const router = express.Router();

router
  .route("/profile")
  .put(
    protect,
    [
      check("name", "Name is required when updating")
        .optional()
        .not()
        .isEmpty(),
      check("bio", "Bio cannot be more than 500 characters")
        .optional()
        .isLength({ max: 500 }),
    ],
    updateProfile
  );

router.get("/:id", getUserProfile);
router.put("/:id/follow", protect, toggleFollow);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

module.exports = router;
