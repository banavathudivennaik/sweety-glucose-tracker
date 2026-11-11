
require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./src/config/db");

const seedDatabase = async () => {
    try {
        console.log("Starting database seeding...");

        // Demo user details
        const name = "Sweety Demo";
        const email = "demo@sweety.com";
        const password = "Sweety@123";

        // Hash password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check whether demo user already exists
        let userResult = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        let userId;

        if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;

            console.log("Demo user already exists.");
        } else {
            userResult = await pool.query(
                `INSERT INTO users (name, email, password_hash)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [name, email, hashedPassword]
            );

            userId = userResult.rows[0].id;

            console.log("Demo user created successfully.");
        }

        // Generate local date in YYYY-MM-DD format
        const getDate = (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        // Sample glucose readings
        const sampleReadings = [
            {
                daysAgo: 0,
                slot: "MORNING",
                value: 105
            },
            {
                daysAgo: 0,
                slot: "AFTER_BREAKFAST",
                value: 145
            },
            {
                daysAgo: 0,
                slot: "AFTER_LUNCH",
                value: 158
            },
            {
                daysAgo: 0,
                slot: "AFTER_DINNER",
                value: 135
            },
            {
                daysAgo: 1,
                slot: "MORNING",
                value: 98
            },
            {
                daysAgo: 1,
                slot: "AFTER_BREAKFAST",
                value: 142
            },
            {
                daysAgo: 1,
                slot: "AFTER_LUNCH",
                value: 152
            },
            {
                daysAgo: 1,
                slot: "AFTER_DINNER",
                value: 128
            }
        ];

        // Insert sample readings
        for (const reading of sampleReadings) {
            const readingDate = getDate(reading.daysAgo);

            await pool.query(
                `INSERT INTO readings
                    (user_id, reading_date, time_slot, glucose_value)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, reading_date, time_slot)
                 DO UPDATE SET
                    glucose_value = EXCLUDED.glucose_value,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    userId,
                    readingDate,
                    reading.slot,
                    reading.value
                ]
            );
        }

        console.log("Sample readings inserted successfully.");

        console.log("--------------------------------");
        console.log("SEED COMPLETED SUCCESSFULLY");
        console.log("--------------------------------");
        console.log("Demo Login Details:");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("Sample readings:", sampleReadings.length);
        console.log("--------------------------------");

    } catch (error) {
        console.error("Seed error:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

seedDatabase();
