const pool = require("../config/db");

// DAILY GLUCOSE REPORT
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Please provide a date (YYYY-MM-DD)"
            });
        }

        const result = await pool.query(
            `SELECT
                COUNT(*)::INTEGER AS total_readings,
                COALESCE(MAX(glucose_value), 0)::INTEGER AS highest,
                COALESCE(MIN(glucose_value), 0)::INTEGER AS lowest,
                COALESCE(ROUND(AVG(glucose_value), 1), 0) AS average
             FROM readings
             WHERE user_id = $1 AND reading_date = $2`,
            [req.user.id, date]
        );

        const readings = await pool.query(
            `SELECT id, reading_date, time_slot, glucose_value
             FROM readings
             WHERE user_id = $1 AND reading_date = $2
             ORDER BY
                CASE time_slot
                    WHEN 'MORNING' THEN 1
                    WHEN 'AFTER_BREAKFAST' THEN 2
                    WHEN 'AFTER_LUNCH' THEN 3
                    WHEN 'AFTER_DINNER' THEN 4
                END`,
            [req.user.id, date]
        );

        return res.status(200).json({
            success: true,
            date,
            report: result.rows[0],
            readings: readings.rows
        });

    } catch (error) {
        console.error("Daily report error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to generate daily report"
        });
    }
};

// MONTHLY GLUCOSE REPORT
const getMonthlyReport = async (req, res) => {
    try {
        const { period = "current" } = req.query;

        if (!["current", "previous"].includes(period)) {
            return res.status(400).json({
                success: false,
                message: "Period must be current or previous"
            });
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        let startDate;
        let endDate;

        if (period === "current") {
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month, today.getDate() + 1);
        } else {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 1);
        }

        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        };

        const start = formatDate(startDate);
        const end = formatDate(endDate);

        const result = await pool.query(
            `SELECT
                COUNT(*)::INTEGER AS total_readings,
                COALESCE(MAX(glucose_value), 0)::INTEGER AS highest,
                COALESCE(MIN(glucose_value), 0)::INTEGER AS lowest,
                COALESCE(ROUND(AVG(glucose_value), 1), 0) AS average
             FROM readings
             WHERE user_id = $1
               AND reading_date >= $2
               AND reading_date < $3`,
            [req.user.id, start, end]
        );

        return res.status(200).json({
            success: true,
            period,
            startDate: start,
            endDate: period === "current" ? formatDate(new Date(year, month, today.getDate())) : formatDate(new Date(year, month, 0)),
            report: result.rows[0]
        });

    } catch (error) {
        console.error("Monthly report error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate monthly report"
        });
    }
};

module.exports = {
    getDailyReport,
    getMonthlyReport
};

