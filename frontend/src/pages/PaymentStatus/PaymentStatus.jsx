import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./PaymentStatus.css";

const PaymentStatus = () => {
    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("");
    const { url, clearCart } = useContext(StoreContext);
    const navigate = useNavigate();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const verify = async () => {
            const rawSearch = window.location.search.replace(/&amp;/g, "&");
            const params = new URLSearchParams(rawSearch);
            const orderId = params.get("orderId");
            const tx_ref = params.get("tx_ref");

            if (!orderId || !tx_ref) {
                setStatus("failed");
                setMessage("Invalid payment link — missing orderId or tx_ref.");
                return;
            }

            try {
                const response = await axios.post(`${url}/api/order/verify`, {
                    orderId,
                    tx_ref,
                });

                if (!isMounted.current) return;

                if (response.data.success) {
                    setStatus("success");
                    setMessage("Your order has been placed successfully!");
                    localStorage.removeItem("guestCart");
                    await clearCart();
                    setTimeout(() => {
                        if (isMounted.current) navigate("/myorders");
                    }, 3000);
                } else {
                    setStatus("failed");
                    setMessage(response.data.message || "Payment could not be verified.");
                }
            } catch (error) {
                if (!isMounted.current) return;
                console.error("Verify error:", error);
                setStatus("failed");
                setMessage("Something went wrong: " + (error.response?.data?.message || error.message));
            }
        };

        verify();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="payment-status">
            {status === "verifying" && (
                <div className="status-card verifying">
                    <div className="spinner"></div>
                    <h2>Verifying your payment...</h2>
                    <p>Please wait, do not close this page.</p>
                </div>
            )}

            {status === "success" && (
                <div className="status-card success">
                    <div className="status-icon">✅</div>
                    <h2>Payment Successful!</h2>
                    <p>{message}</p>
                    <p className="redirect-note">Redirecting to your orders in 3 seconds...</p>
                    <button onClick={() => navigate("/myorders")}>View My Orders</button>
                </div>
            )}

            {status === "failed" && (
                <div className="status-card failed">
                    <div className="status-icon">❌</div>
                    <h2>Payment Verification Failed</h2>
                    <p>{message}</p>
                    <p className="redirect-note">
                        If you completed payment, check{" "}
                        <span
                            style={{ color: "#e85d04", cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => navigate("/myorders")}
                        >
                            My Orders
                        </span>{" "}
                        — it may have been processed.
                    </p>
                    <div className="action-buttons">
                        <button onClick={() => navigate("/myorders")}>My Orders</button>
                        <button className="secondary" onClick={() => navigate("/cart")}>Try Again</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentStatus;
