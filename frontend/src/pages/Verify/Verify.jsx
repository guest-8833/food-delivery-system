import React, { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import "./Verify.css";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { url } = useContext(StoreContext);
  const [status, setStatus] = useState("verifying");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const tx_ref = searchParams.get("tx_ref");
    const token = localStorage.getItem("token");

    if (!orderId || !tx_ref) {
      setStatus("error");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await axios.post(
          `${url}/api/order/verify`,
          { orderId, tx_ref },
          { headers: { token } }
        );
        if (!isMounted.current) return;
        if (response.data.success) {
          setStatus("success");
          setTimeout(() => {
            if (isMounted.current) navigate("/myorders");
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (err) {
        if (isMounted.current) {
          console.error(err);
          setStatus("error");
        }
      }
    };
    verifyPayment();
  }, [searchParams, navigate, url]);

  if (status === "verifying") {
    return (
      <div className="verify-container">
        <div className="verify-spinner"></div>
        <h2>Verifying Payment</h2>
        <p>Please wait while we confirm your transaction...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="verify-container">
        <div className="verify-success">✅</div>
        <h2>Payment Successful!</h2>
        <p>Your order has been confirmed.</p>
        <p className="verify-subtext">Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <div className="verify-failed">❌</div>
      <h2>Verification Failed</h2>
      <p>We could not verify your payment.</p>
      <p className="verify-subtext">Please contact support or try again.</p>
    </div>
  );
};

export default Verify;
