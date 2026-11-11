const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    getDailyReport,
    getMonthlyReport
} = require("../controllers/reportController");

router.use(authMiddleware);

// Daily glucose report
router.get("/daily", getDailyReport);
router.get("/monthly", getMonthlyReport);
module.exports = router;