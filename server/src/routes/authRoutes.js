
const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");

// Register a new user
router.post("/signup", signup);

// Login existing user
router.post("/login", login);

module.exports = router;
