import { useState } from "react";
import API from "../api/axios";
import "./Auth.css";

function Auth({ onLogin }) {
    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isSignup ? "/auth/signup" : "/auth/login";

            const payload = isSignup
                ? { name, email, password }
                : { email, password };

            const response = await API.post(endpoint, payload);

            if (isSignup) {
                setIsSignup(false);
                setPassword("");
                alert("Account created successfully! Please login.");
            } else {
                onLogin(response.data.token, response.data.user);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Sweety</h1>
                <p className="subtitle">Blood Glucose Tracker</p>

                <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
                <p className="description">
                    {isSignup
                        ? "Create your account to track your glucose readings."
                        : "Login to manage your glucose readings."}
                </p>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    {isSignup && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Please wait..."
                            : isSignup
                            ? "Create Account"
                            : "Login"}
                    </button>
                </form>

                <p className="toggle-text">
                    {isSignup
                        ? "Already have an account?"
                        : "Don't have an account?"}

                    <button
                        type="button"
                        className="toggle-button"
                        onClick={() => {
                            setIsSignup(!isSignup);
                            setError("");
                        }}
                    >
                        {isSignup ? "Login" : "Sign Up"}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Auth;