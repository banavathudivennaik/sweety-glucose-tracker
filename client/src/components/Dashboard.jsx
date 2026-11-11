
import React, { useEffect, useState } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import "./Dashboard.css";
import API from "../api/axios";

function Dashboard({ user, onLogout }) {

    // Get today's date
    const getToday = () => {
        const today = new Date();

        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    };

    const todayString = getToday();

    // Reading states
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Add / Edit form states
    const [newReadingDate, setNewReadingDate] = useState(todayString);
    const [newTimeSlot, setNewTimeSlot] = useState("MORNING");
    const [glucoseValue, setGlucoseValue] = useState("");

    const [saving, setSaving] = useState(false);
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState("");

    // Edit state
    const [editingId, setEditingId] = useState(null);

    // Delete state
    const [deletingId, setDeletingId] = useState(null);

    // Report selection states
    const [period, setPeriod] = useState("DAILY");
    const [selectedDate, setSelectedDate] = useState(todayString);

    const [startDate, setStartDate] = useState(
        todayString.slice(0, 7) + "-01"
    );

    const [endDate, setEndDate] = useState(todayString);

    // Fetch readings from backend
    const fetchReadings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/readings");

            if (response.data.success) {
                setReadings(response.data.readings || []);
            }

        } catch (err) {
            console.error("Fetch readings error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load glucose readings"
            );

        } finally {
            setLoading(false);
        }
    };

    // Load readings when dashboard opens
    useEffect(() => {
        fetchReadings();
    }, []);

    // Reset form
    const resetForm = () => {
        setNewReadingDate(todayString);
        setNewTimeSlot("MORNING");
        setGlucoseValue("");
        setEditingId(null);
        setAddError("");
        setAddSuccess("");
    };

    // Add or Update reading
    const handleSubmitReading = async (e) => {
        e.preventDefault();

        setAddError("");
        setAddSuccess("");

        // Validate date
        if (!newReadingDate) {
            setAddError("Please select a reading date.");
            return;
        }

        if (newReadingDate > todayString) {
            setAddError("Date cannot be in the future.");
            return;
        }

        // Validate glucose value
        if (
            glucoseValue === "" ||
            !Number.isInteger(Number(glucoseValue)) ||
            Number(glucoseValue) < 40 ||
            Number(glucoseValue) > 600
        ) {
            setAddError(
                "Glucose value must be an integer between 40 and 600 mg/dL."
            );
            return;
        }

        const readingData = {
            reading_date: newReadingDate,
            time_slot: newTimeSlot,
            glucose_value: Number(glucoseValue)
        };

        try {
            setSaving(true);

            let response;

            if (editingId !== null) {
                // UPDATE existing reading
                response = await API.put(
                    `/readings/${editingId}`,
                    readingData
                );
            } else {
                // CREATE new reading
                response = await API.post(
                    "/readings",
                    readingData
                );
            }

            setAddSuccess(
                response.data.message ||
                (
                    editingId !== null
                        ? "Reading updated successfully!"
                        : "Glucose reading added successfully!"
                )
            );

            // Reset form
            setNewReadingDate(todayString);
            setNewTimeSlot("MORNING");
            setGlucoseValue("");
            setEditingId(null);

            // Refresh history and reports
            await fetchReadings();

        } catch (err) {
            console.error("Save reading error:", err);

            setAddError(
                err.response?.data?.message ||
                "Unable to save glucose reading."
            );

        } finally {
            setSaving(false);
        }
    };

    // EDIT reading
    const handleEditReading = (reading) => {
    setEditingId(reading.id);

    // Keep the original date string without timezone conversion
    setNewReadingDate(
        String(reading.reading_date).slice(0, 10)
    );

    setNewTimeSlot(reading.time_slot);

    setGlucoseValue(String(reading.glucose_value));

    setAddError("");
    setAddSuccess("");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};

    // Cancel edit
    const handleCancelEdit = () => {
        resetForm();
    };

    // DELETE reading
    const handleDeleteReading = async (id) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this glucose reading?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(id);
            setError("");
            setAddError("");
            setAddSuccess("");

            const response = await API.delete(
                `/readings/${id}`
            );

            setAddSuccess(
                response.data.message ||
                "Reading deleted successfully!"
            );

            // If the deleted reading is currently being edited,
            // reset the edit form.
            if (editingId === id) {
                resetForm();
            }

            // Refresh dashboard
            await fetchReadings();

        } catch (err) {
            console.error("Delete reading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to delete glucose reading."
            );

        } finally {
            setDeletingId(null);
        }
    };

    // Format date
   const formatDate = (date) => {
    if (!date) return "";

    const dateString = String(date).slice(0, 10);
    const [year, month, day] = dateString.split("-");

    return `${day}-${month}-${year}`;
};

    // Format time slot
    const formatSlot = (slot) => {
        return String(slot)
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Calculate report date range
    let reportStart = selectedDate;
    let reportEnd = selectedDate;

    // Month-to-date report
    if (period === "MONTH_TO_DATE") {
        reportStart = selectedDate.slice(0, 7) + "-01";
        reportEnd = selectedDate;
    }

    // Previous month report
    if (period === "PREVIOUS_MONTH") {
        const date = new Date(
            Number(selectedDate.slice(0, 4)),
            Number(selectedDate.slice(5, 7)) - 1,
            1
        );

        date.setMonth(date.getMonth() - 1);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");

        reportStart = `${year}-${month}-01`;

        const lastDay = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
        ).getDate();

        reportEnd = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    }

    // Custom date range report
    if (period === "DATE_RANGE") {
        reportStart = startDate;
        reportEnd = endDate;
    }

    // Filter readings according to selected report
    const filteredReadings = readings.filter((reading) => {
        const readingDate = String(reading.reading_date).slice(0, 10);

        return (
            readingDate >= reportStart &&
            readingDate <= reportEnd
        );
    });

    // Calculate report statistics
   const values = filteredReadings.map(
    (reading) => Number(reading.glucose_value)
);

    const totalReadings = values.length;

    const highestReading = totalReadings
        ? Math.max(...values)
        : "--";

    const lowestReading = totalReadings
        ? Math.min(...values)
        : "--";

    const averageReading = totalReadings
        ? (
            values.reduce((sum, value) => sum + value, 0) /
            totalReadings
        ).toFixed(1)
        : "--";

    // Report date range label
    const reportRange = `${formatDate(reportStart)} to ${formatDate(reportEnd)}`;

    // Validate date range
    const invalidDateRange =
        period === "DATE_RANGE" &&
        (!startDate || !endDate || startDate > endDate);

    return (
        <div className="dashboard">

            {/* Dashboard Header */}
            <header className="dashboard-header">

                <div>
                    <h1>Sweety</h1>
                    <p>Blood Glucose Tracker</p>
                </div>

                <button onClick={onLogout}>
                    Logout
                </button>

            </header>

            <main className="dashboard-content">

                <h2>Hello, {user.name}!</h2>

                <p>
                    Welcome to your personal glucose tracker.
                </p>

                {/* ADD / EDIT GLUCOSE READING */}
                <section className="reading-section">

                    <h2>
                        {editingId !== null
                            ? "Edit Glucose Reading"
                            : "Add Glucose Reading"}
                    </h2>

                    <form onSubmit={handleSubmitReading}>

                        <div>
                            <label>Reading Date:</label>

                            <input
                                type="date"
                                value={newReadingDate}
                                max={todayString}
                                onChange={(e) => {
                                    setNewReadingDate(e.target.value);
                                    setAddError("");
                                    setAddSuccess("");
                                }}
                                required
                            />
                        </div>

                        <div>
                            <label>Time Slot:</label>

                            <select
                                value={newTimeSlot}
                                onChange={(e) => {
                                    setNewTimeSlot(e.target.value);
                                    setAddError("");
                                    setAddSuccess("");
                                }}
                                required
                            >
                                <option value="MORNING">
                                    Morning
                                </option>

                                <option value="AFTER_BREAKFAST">
                                    After Breakfast
                                </option>

                                <option value="AFTER_LUNCH">
                                    After Lunch
                                </option>

                                <option value="AFTER_DINNER">
                                    After Dinner
                                </option>

                            </select>
                        </div>

                        <div>
                            <label>Glucose Value (mg/dL):</label>

                            <input
                                type="number"
                                min="40"
                                max="600"
                                step="1"
                                placeholder="Enter glucose value"
                                value={glucoseValue}
                                onChange={(e) => {
                                    setGlucoseValue(e.target.value);
                                    setAddError("");
                                    setAddSuccess("");
                                }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId !== null
                                    ? "Update Reading"
                                    : "Save Reading"}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        )}

                    </form>

                    {addError && (
                        <p className="error-message">
                            {addError}
                        </p>
                    )}

                    {addSuccess && (
                        <p className="success-message">
                            {addSuccess}
                        </p>
                    )}

                </section>

                {/* REPORT SELECTION */}
                <section className="reading-section">

                    <h2>Glucose Reports</h2>

                    <div className="chart-filters">

    <button
        className={period === "DAILY" ? "active" : ""}
        onClick={() => setPeriod("DAILY")}
    >
        Daily
    </button>

    <button
        className={period === "MONTH_TO_DATE" ? "active" : ""}
        onClick={() => setPeriod("MONTH_TO_DATE")}
    >
        Month-to-date
    </button>

    <button
        className={period === "PREVIOUS_MONTH" ? "active" : ""}
        onClick={() => setPeriod("PREVIOUS_MONTH")}
    >
        Monthly (Previous Month)
    </button>

    <button
        className={period === "DATE_RANGE" ? "active" : ""}
        onClick={() => setPeriod("DATE_RANGE")}
    >
        Date Range
    </button>

</div>

                    {/* Selected Date */}
                    {period !== "DATE_RANGE" && (
                        <div>

                            <label>Select Report Date: </label>

                            <input
                                type="date"
                                value={selectedDate}
                                max={todayString}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                            />

                        </div>
                    )}

                    {/* Date Range Selection */}
                    {period === "DATE_RANGE" && (
                        <div className="date-range-filter">

                            <div>
                                <label>Start Date: </label>

                                <input
                                    type="date"
                                    value={startDate}
                                    max={todayString}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label>End Date: </label>

                                <input
                                    type="date"
                                    value={endDate}
                                    max={todayString}
                                    onChange={(e) =>
                                        setEndDate(e.target.value)
                                    }
                                />
                            </div>

                        </div>
                    )}

                    <p>
                        <strong>Report Period:</strong>{" "}
                        {invalidDateRange
                            ? "Please select a valid date range."
                            : reportRange}
                    </p>

                </section>

                {/* REPORT STATISTICS */}
                <div className="dashboard-cards">

                    <div className="dashboard-card">
                        <h3>Total Readings</h3>
                        <p>{loading ? "..." : totalReadings}</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Highest Reading</h3>
                        <p>{loading ? "..." : highestReading}</p>
                        <small>mg/dL</small>
                    </div>

                    <div className="dashboard-card">
                        <h3>Lowest Reading</h3>
                        <p>{loading ? "..." : lowestReading}</p>
                        <small>mg/dL</small>
                    </div>

                    <div className="dashboard-card">
                        <h3>Average Reading</h3>
                        <p>{loading ? "..." : averageReading}</p>
                        <small>mg/dL</small>
                    </div>

                </div>

                {/* GLUCOSE HISTORY CHART */}
                <section className="reading-section">

                    <h2>Glucose History Chart</h2>

                    <p>
                        Track your blood glucose levels over time.
                    </p>

                    {loading ? (
                        <p>Loading chart...</p>
                    ) : invalidDateRange ? (
                        <p>Please select a valid date range.</p>
                    ) : filteredReadings.length > 0 ? (

                        <ResponsiveContainer width="100%" height={300}>

                            <LineChart
                                data={[...filteredReadings].reverse()}
                            >

                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="reading_date"
                                    tickFormatter={(date) =>
                                        String(date).slice(5, 10)
                                    }
                                />

                                <YAxis />

                                <Tooltip
                                    formatter={(value) => [
                                        `${value} mg/dL`,
                                        "Glucose"
                                    ]}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="glucose_value"
                                    stroke="#16a34a"
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                    activeDot={{ r: 7 }}
                                />

                            </LineChart>

                        </ResponsiveContainer>

                    ) : (
                        <p>No readings available for this report.</p>
                    )}

                </section>

                {/* READING HISTORY WITH CRUD ACTIONS */}
                <section className="reading-section">

                    <div>
                        <h2>Glucose Readings</h2>
                        <p>
                            Readings for the selected report period.
                        </p>
                    </div>

                    <button
                        onClick={fetchReadings}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>

                    {error && (
                        <p className="error-message">
                            {error}
                        </p>
                    )}

                    {!loading && !error && !invalidDateRange &&
                        filteredReadings.length === 0 && (
                            <p>
                                No glucose readings found for this period.
                            </p>
                        )}

                    {!loading && !error && !invalidDateRange &&
                        filteredReadings.length > 0 && (

                            <div className="reading-table-container">

                                <table className="reading-table">

                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time Slot</th>
                                            <th>Glucose Value</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {filteredReadings.map((reading) => (

                                            <tr key={reading.id}>

                                                <td>
                                                    {formatDate(reading.reading_date)}
                                                </td>

                                                <td>
                                                    {formatSlot(reading.time_slot)}
                                                </td>

                                                <td>
                                                    {reading.glucose_value} mg/dL
                                                </td>

                                                <td>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEditReading(reading)
                                                        }
                                                        disabled={
                                                            saving ||
                                                            deletingId !== null
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteReading(reading.id)
                                                        }
                                                        disabled={
                                                            deletingId === reading.id ||
                                                            saving
                                                        }
                                                    >
                                                        {deletingId === reading.id
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </button>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>
                        )}

                </section>

            </main>

        </div>
    );
}

export default Dashboard;
