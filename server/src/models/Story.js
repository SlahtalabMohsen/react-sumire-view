const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    maxlength: [1000, "Description cannot be more than 1000 characters"],
  },
  coverImage: {
    type: String,
    default: "default-cover.jpg",
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
    },
  ],
  genre: {
    type: String,
    required: [true, "Genre is required"],
    enum: [
      "Fantasy",
      "Science Fiction",
      "Mystery",
      "Romance",
      "Adventure",
      "Horror",
      "Other",
    ],
  },
  status: {
    type: String,
    enum: ["ongoing", "completed", "hiatus"],
    default: "ongoing",
  },
  tags: [
    {
      type: String,
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before save
storySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Story", storySchema);
