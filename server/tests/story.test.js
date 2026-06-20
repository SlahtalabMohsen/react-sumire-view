const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../src/index");
const Story = require("../src/models/Story");
const User = require("../src/models/User");
const { generateToken } = require("../src/utils/auth");

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create a test user
  const user = await User.create({
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    name: "Test User",
  });

  userId = user._id;
  token = generateToken(user._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Story.deleteMany({});
});

describe("Story Routes", () => {
  describe("POST /api/stories", () => {
    it("should create a new story", async () => {
      const res = await request(app)
        .post("/api/stories")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test Story",
          description: "This is a test story",
          genre: "Fantasy",
          tags: ["test", "fantasy"],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.story).toHaveProperty("title", "Test Story");
      expect(res.body.story).toHaveProperty("author", userId.toString());
    });

    it("should not create a story without authentication", async () => {
      const res = await request(app).post("/api/stories").send({
        title: "Test Story",
        description: "This is a test story",
        genre: "Fantasy",
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/stories", () => {
    beforeEach(async () => {
      await Story.create([
        {
          title: "Story 1",
          description: "Description 1",
          genre: "Fantasy",
          author: userId,
        },
        {
          title: "Story 2",
          description: "Description 2",
          genre: "Science Fiction",
          author: userId,
        },
      ]);
    });

    it("should get all stories with pagination", async () => {
      const res = await request(app)
        .get("/api/stories")
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.stories).toHaveLength(2);
      expect(res.body.pagination).toHaveProperty("current", 1);
    });

    it("should filter stories by genre", async () => {
      const res = await request(app)
        .get("/api/stories")
        .query({ genre: "Fantasy" });

      expect(res.statusCode).toBe(200);
      expect(res.body.stories).toHaveLength(1);
      expect(res.body.stories[0]).toHaveProperty("genre", "Fantasy");
    });
  });

  describe("PUT /api/stories/:id", () => {
    let storyId;

    beforeEach(async () => {
      const story = await Story.create({
        title: "Original Title",
        description: "Original Description",
        genre: "Fantasy",
        author: userId,
      });
      storyId = story._id;
    });

    it("should update a story", async () => {
      const res = await request(app)
        .put(`/api/stories/${storyId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
          description: "Updated Description",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.story).toHaveProperty("title", "Updated Title");
      expect(res.body.story).toHaveProperty(
        "description",
        "Updated Description"
      );
    });

    it("should not update a story owned by another user", async () => {
      const otherUser = await User.create({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
        name: "Other User",
      });

      const otherToken = generateToken(otherUser._id);

      const res = await request(app)
        .put(`/api/stories/${storyId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          title: "Updated Title",
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
