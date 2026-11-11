import { useState } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLogin = (token, userData) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    if (!user) {
        return <Auth onLogin={handleLogin} />;
    }

    return (
        <Dashboard
            user={user}
            onLogout={handleLogout}
        />
    );
}

export default App;