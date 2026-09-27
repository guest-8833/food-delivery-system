import React, { useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import DailyReport from "./pages/Dailyreport/Dailyreport";
import Login from "./pages/Login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { clearToken, isAuthenticated } from "./utils/auth";

const App = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  // Force login on every fresh app load, regardless of existing token
  useEffect(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, []); // empty deps = runs once, on mount

  return (
    <div className="admin-app">
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={isAuthenticated() ? <Navigate to="/add" replace /> : <Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar onLogout={handleLogout} />
              <div className="main-layout">
                <Sidebar />
                <div className="content-area">
                  <Routes>
                    <Route path="/add" element={<Add />} />
                    <Route path="/list" element={<List />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/daily-report" element={<DailyReport />} />
                    <Route path="/" element={<List />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
