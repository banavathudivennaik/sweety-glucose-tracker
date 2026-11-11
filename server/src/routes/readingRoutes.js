const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    getReadings,
    addReading,
    updateReading,
    deleteReading
} = require("../controllers/readingController");

// All routes below require a valid login token
router.use(authMiddleware);

// Get all readings for logged-in user
router.get("/", getReadings);

// Add a new glucose reading
router.post("/", addReading);
// Update a glucose reading
router.put("/:id", updateReading);

// Delete a glucose reading
router.delete("/:id", deleteReading);

module.exports = router;