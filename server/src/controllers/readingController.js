
const pool = require("../config/db");

// Allowed glucose reading time slots
const validSlots = [
    "MORNING",
    "AFTER_BREAKFAST",
    "AFTER_LUNCH",
    "AFTER_DINNER"
];

// Validate date, glucose value and time slot
const validateReading = (reading_date, time_slot, glucose_value) => {
    if (!reading_date || !time_slot) {
        return "Date and time slot are required.";
    }

    if (
        glucose_value === undefined ||
        glucose_value === null ||
        glucose_value === ""
    ) {
        return "Please enter a glucose value.";
    }

    if (!validSlots.includes(time_slot)) {
        return "Invalid time slot.";
    }

    const value = Number(glucose_value);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
        return "Glucose value must be an integer between 40 and 600 mg/dL.";
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(reading_date)) {
        return "Invalid reading date.";
    }

    const [year, month, day] = reading_date.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return "Invalid reading date.";
    }

    const today = new Date();

    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (reading_date > todayString) {
        return "Future dates are not allowed.";
    }

    return null;
};

// GET ALL READINGS FOR LOGGED-IN USER
const getReadings = async (req, res) => {
    try {
       const result = await pool.query(
    `SELECT
        id,
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
        time_slot,
        glucose_value,
        created_at,
        updated_at
     FROM readings
     WHERE user_id = $1
     ORDER BY reading_date DESC, created_at DESC`,
    [req.user.id]
);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch readings"
        });
    }
};

// ADD NEW READING
const addReading = async (req, res) => {
    let client;

    try {
        const {
            reading_date,
            time_slot,
            glucose_value
        } = req.body;

        // Validate input
        const validationError = validateReading(
            reading_date,
            time_slot,
            glucose_value
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const value = Number(glucose_value);

        client = await pool.connect();

        await client.query("BEGIN");

        // Lock this user's date to prevent concurrent additions
        await client.query(
            `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
            [`${req.user.id}:${reading_date}`]
        );

        // Check how many readings already exist on this date
        const countResult = await client.query(
            `SELECT COUNT(*) AS total
             FROM readings
             WHERE user_id = $1
             AND reading_date = $2`,
            [req.user.id, reading_date]
        );

        const total = Number(countResult.rows[0].total);

        if (total >= 4) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "You can add only 4 readings per day."
            });
        }

        // Insert reading
        
const result = await client.query(
    `INSERT INTO readings
        (user_id, reading_date, time_slot, glucose_value)
     VALUES ($1, $2, $3, $4)
     RETURNING
        id,
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
        time_slot,
        glucose_value`,
    [req.user.id, reading_date, time_slot, value]
);


        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Glucose reading added successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        // Duplicate date and time slot
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "You already have a reading for this time slot and date."
            });
        }

        console.error("Add reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to add reading"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// UPDATE AN EXISTING READING
const updateReading = async (req, res) => {
    let client;

    try {
        const { id } = req.params;

        const {
            reading_date,
            time_slot,
            glucose_value
        } = req.body;

        // Validate input
        const validationError = validateReading(
            reading_date,
            time_slot,
            glucose_value
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const value = Number(glucose_value);

        client = await pool.connect();

        await client.query("BEGIN");

        // Lock the target date for this user
        await client.query(
            `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
            [`${req.user.id}:${reading_date}`]
        );

        // Confirm that this reading belongs to the logged-in user
        const existingResult = await client.query(
            `SELECT id
             FROM readings
             WHERE id = $1
             AND user_id = $2
             FOR UPDATE`,
            [id, req.user.id]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Reading not found"
            });
        }

        // Count readings on the target date, excluding the current reading
        const countResult = await client.query(
            `SELECT COUNT(*) AS total
             FROM readings
             WHERE user_id = $1
             AND reading_date = $2
             AND id <> $3`,
            [req.user.id, reading_date, id]
        );

        const total = Number(countResult.rows[0].total);

        if (total >= 4) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "You can have only 4 readings per day."
            });
        }

        // Update reading
        
const result = await client.query(
    `UPDATE readings
     SET
        reading_date = $1,
        time_slot = $2,
        glucose_value = $3,
        updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     AND user_id = $5
     RETURNING
        id,
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
        time_slot,
        glucose_value`,
    [
        reading_date,
        time_slot,
        value,
        id,
        req.user.id
    ]
);


        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Reading updated successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A reading already exists for this time slot and date."
            });
        }

        console.error("Update reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update reading"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// DELETE AN EXISTING READING
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1
             AND user_id = $2
             RETURNING id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reading not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Reading deleted successfully"
        });

    } catch (error) {
        console.error("Delete reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete reading"
        });
    }
};

// EXPORT CONTROLLER FUNCTIONS
module.exports = {
    getReadings,
    addReading,
    updateReading,
    deleteReading
};
