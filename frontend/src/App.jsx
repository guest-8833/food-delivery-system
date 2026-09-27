import React, { useState, Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";

const Home = lazy(() => import("./pages/Home/Home"));
const Cart = lazy(() => import("./pages/Cart/Cart"));
const Favorites = lazy(() => import("./pages/Favorites/Favorites"));
const Verify = lazy(() => import("./pages/Verify/Verify"));
const MyOrders = lazy(() => import("./pages/MyOrders/MyOrders"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus/PaymentStatus"));

const PageLoader = () => (
  <div
    style={{
      minHeight: "50vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <p>Loading...</p>
  </div>
);

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        <Navbar setShowLogin={setShowLogin} />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/myorders" element={<MyOrders />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </>
  );
};

export default App;