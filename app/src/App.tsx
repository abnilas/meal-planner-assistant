import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/pages/dashboard";
import { ROUTES } from "@/constants";

function App() {
    return (
        <Router>
            <Routes>
                <Route path={ROUTES.HOME} element={<Dashboard />} />
                <Route path={ROUTES.CHAT} element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
