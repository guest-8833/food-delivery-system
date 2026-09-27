import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import "./MyOrders.css";

const ORDER_STEPS = [
    { key: "Food Processing", label: "Processing", icon: "👨‍🍳" },
    { key: "Out for Delivery", label: "Out for Delivery", icon: "🛵" },
    { key: "Delivered", label: "Delivered", icon: "🎉" },
];

const getActiveStepIndex = (status) => {
    if (status === "Cancelled" || status === "Pending Payment") return -1;
    return ORDER_STEPS.findIndex((s) => s.key === status);
};

const POLL_INTERVAL_MS = 15000;
const FALLBACK_PARCEL_ICON = "https://cdn-icons-png.flaticon.com/512/1047/1047711.png";

// Format a number as Ethiopian Birr
const formatETB = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return `ETB 0`;
    return `ETB ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ---------- Review sub-components ---------- */

const StarRating = ({ value = 0, onRate, readOnly = false }) => (
    <div className="star-rating">
        {[1, 2, 3, 4, 5].map((n) => (
            <span
                key={n}
                className={`star ${n <= value ? "star-filled" : ""}`}
                onClick={() => !readOnly && onRate && onRate(n)}
                style={{ cursor: readOnly ? "default" : "pointer" }}
                role={readOnly ? undefined : "button"}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
                ★
            </span>
        ))}
    </div>
);

const ReviewForm = ({ order, url, token, onReviewed }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating < 1) {
            toast.error("Please pick a rating before submitting.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(
                `${url}/api/order/review`,
                { orderId: order._id, rating, comment },
                { headers: { token } }
            );
            if (res.data.success) {
                toast.success("Thanks for your review!");
                onReviewed(order._id, { rating, comment });
            } else {
                toast.error(res.data.message || "Failed to submit review");
            }
        } catch (err) {
            console.error("review submit error:", err);
            toast.error(err.response?.data?.message || "Error submitting review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-form">
            <p className="review-prompt">How was your order?</p>
            <StarRating value={rating} onRate={setRating} />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment (optional)"
                rows={3}
                maxLength={500}
            />
            <button
                className="review-submit"
                onClick={handleSubmit}
                disabled={submitting || rating < 1}
            >
                {submitting ? "Submitting..." : "Submit Review"}
            </button>
        </div>
    );
};

const ReviewDisplay = ({ review }) => (
    <div className="review-display">
        <p className="review-label">Your review:</p>
        <StarRating value={review.rating || 0} readOnly />
        {review.comment && <p className="review-comment">"{review.comment}"</p>}
        {review.adminReply?.text && (
            <div className="admin-reply">
                <span className="admin-reply-label">💬 Reply from us:</span>
                <p className="admin-reply-text">"{review.adminReply.text}"</p>
            </div>
        )}
    </div>
);

/* ---------- Main component ---------- */

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const { token, url } = useContext(StoreContext);
    const navigate = useNavigate();
    const pollRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchOrders = useCallback(async (isBackgroundRefresh = false) => {
        if (!token) return;
        if (!isBackgroundRefresh) setLoading(true);
        try {
            const response = await axios.post(
                `${url}/api/order/userorders`,
                {},
                { headers: { token } }
            );
            if (!isMounted.current) return;
            if (response.data.success) {
                setOrders(response.data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            if (isMounted.current) console.error("Error fetching orders:", error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [token, url]);

    useEffect(() => {
        if (token) fetchOrders();
    }, [token, fetchOrders]);

    useEffect(() => {
        if (!token) return;
        pollRef.current = setInterval(() => fetchOrders(true), POLL_INTERVAL_MS);
        return () => clearInterval(pollRef.current);
    }, [token, fetchOrders]);

    // Called after a review is submitted — patch the local list so UI updates instantly
    const handleReviewed = (orderId, review) => {
        setOrders((prev) =>
            prev.map((o) =>
                o._id === orderId
                    ? { ...o, review: { ...(o.review || {}), ...review } }
                    : o
            )
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Food Processing": return "#f48c06";
            case "Out for Delivery": return "#2196F3";
            case "Delivered": return "#4CAF50";
            case "Cancelled": return "#e63946";
            case "Pending Payment": return "#999";
            default: return "#999";
        }
    };

    if (!token) {
        return (
            <div className="my-orders">
                <h2>My Orders</h2>
                <div className="container">
                    <p>Please login to view your orders.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="my-orders">
                <h2>My Orders</h2>
                <div className="container">
                    <div className="loading-spinner">Loading your orders...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-orders">
            <div className="my-orders-heading">
                <h2>My Orders</h2>
                {lastUpdated && (
                    <span className="live-indicator">
                        <span className="live-dot"></span>
                        Live — updated {lastUpdated.toLocaleTimeString()}
                    </span>
                )}
            </div>

            <div className="container">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <p>No orders found.</p>
                        <button onClick={() => navigate("/")}>Start Shopping</button>
                    </div>
                ) : (
                    orders.map((order) => {
                        const activeStep = getActiveStepIndex(order.status);
                        const isCancelled = order.status === "Cancelled";
                        const isPendingPayment = order.status === "Pending Payment";
                        const isDelivered = order.status === "Delivered";
                        const hasReview = Boolean(order.review && order.review.rating);

                        return (
                            <div key={order._id} className="my-orders-order">
                                <div className="my-orders-order-top">
                                    <img
                                        src={assets.parcel_icon || FALLBACK_PARCEL_ICON}
                                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PARCEL_ICON; }}
                                        alt="order icon"
                                    />
                                    <div className="order-info">
                                        <p className="order-items">
                                            {order.items.map((item, idx) => (
                                                <span key={idx}>
                                                    {item.name} x {item.quantity}
                                                    {idx !== order.items.length - 1 && ", "}
                                                </span>
                                            ))}
                                        </p>
                                        <p className="order-date">
                                            {new Date(order.date).toLocaleDateString("en-US", {
                                                year: "numeric", month: "short", day: "numeric",
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </p>
                                        <p className="order-payment">
                                            Payment: {order.paymentMethod?.toUpperCase()} —{" "}
                                            {order.payment ? "✅ Paid" : "⏳ Pending"}
                                        </p>
                                    </div>
                                    <p className="order-amount">{formatETB(order.amount)}</p>
                                    <p className="order-items-count">
                                        Items: {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                                    </p>
                                    <p className="order-status" style={{ color: getStatusColor(order.status) }}>
                                        ● <b>{order.status || "Pending Payment"}</b>
                                    </p>
                                    <button onClick={() => fetchOrders()}>Refresh</button>
                                </div>

                                {isCancelled ? (
                                    <div className="order-cancelled-banner">✖ This order was cancelled.</div>
                                ) : isPendingPayment ? (
                                    <div className="order-pending-banner">⏳ Waiting for payment confirmation...</div>
                                ) : (
                                    <div className="order-tracker">
                                        {ORDER_STEPS.map((step, idx) => (
                                            <React.Fragment key={step.key}>
                                                <div
                                                    className={
                                                        `tracker-step ` +
                                                        `${idx <= activeStep ? "completed" : ""} ` +
                                                        `${idx === activeStep ? "current" : ""}`
                                                    }
                                                >
                                                    <div className="tracker-icon">{step.icon}</div>
                                                    <span className="tracker-label">{step.label}</span>
                                                </div>
                                                {idx < ORDER_STEPS.length - 1 && (
                                                    <div className={`tracker-line ${idx < activeStep ? "completed" : ""}`}></div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}

                                {/* ── Review section ── */}
                                {isDelivered && (
                                    hasReview ? (
                                        <ReviewDisplay review={order.review} />
                                    ) : (
                                        <ReviewForm
                                            order={order}
                                            url={url}
                                            token={token}
                                            onReviewed={handleReviewed}
                                        />
                                    )
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MyOrders;