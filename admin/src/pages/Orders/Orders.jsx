import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./Orders.css";
import { toast } from "react-toastify";
import api from "../../services/api";
import { isAuthenticated } from "../../utils/auth";
import { assets } from "../../assets/assets";

// Values must match the backend's validStatuses exactly — only the
// displayed label is translated, not the value sent to the API.
const STATUS_OPTIONS = [
  { value: "Pending Payment", labelKey: "orders.statusPendingPayment" },
  { value: "Food Processing", labelKey: "orders.statusFoodProcessing" },
  { value: "Out for Delivery", labelKey: "orders.statusOutForDelivery" },
  { value: "Delivered", labelKey: "orders.statusDelivered" },
  { value: "Cancelled", labelKey: "orders.statusCancelled" },
];

/* ── Reply box shown under each order that has a customer review ── */
const ReplyBox = ({ order, onReplied }) => {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const response = await api.post("/api/order/review/reply", {
        orderId: order._id,
        reply,
      });
      if (response.data.success) {
        toast.success("Reply sent");
        onReplied(order._id, response.data.review);
        setReply("");
      } else {
        toast.error(response.data.message || "Failed to send reply");
      }
    } catch (error) {
      console.error("Reply error:", error);
      toast.error(error.response?.data?.message || "Error sending reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="order-reply-box">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a reply to the customer..."
        rows={2}
        maxLength={500}
      />
      <button onClick={handleSend} disabled={sending || !reply.trim()}>
        {sending ? "Sending..." : "Send Reply"}
      </button>
    </div>
  );
};

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchAllOrders = async () => {
    if (!isAuthenticated()) {
      toast.error(t("orders.notAuthenticated"));
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/api/order/list");
      if (!isMounted.current) return;
      if (response.data.success) setOrders(response.data.data);
      else toast.error(response.data.message || t("orders.fetchFailed"));
    } catch (error) {
      if (!isMounted.current) return;
      console.error("fetchAllOrders error:", error);
      toast.error(error.isAuthError ? t("orders.unauthorizedRelogin") : t("orders.fetchError"));
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    if (!isAuthenticated()) {
      toast.error(t("orders.notAuthenticatedShort"));
      return;
    }
    const newStatus = event.target.value;
    setUpdatingId(orderId);
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
    try {
      const response = await api.post("/api/order/status", { orderId, status: newStatus });
      if (!isMounted.current) return;
      if (response.data.success) toast.success(t("orders.statusUpdateSuccess"));
      else { toast.error(response.data.message || t("orders.statusUpdateFailed")); await fetchAllOrders(); }
    } catch (error) {
      if (!isMounted.current) return;
      console.error("statusHandler error:", error);
      toast.error(error.response?.data?.message || t("orders.statusUpdateError"));
      await fetchAllOrders();
    } finally {
      if (isMounted.current) setUpdatingId(null);
    }
  };

  const removeOrder = async (orderId) => {
    if (!isAuthenticated()) {
      toast.error(t("orders.notAuthenticatedShort"));
      return;
    }
    if (!window.confirm(t("orders.deleteConfirm"))) return;
    setDeletingId(orderId);
    try {
      const response = await api.post("/api/order/remove", { orderId });
      if (!isMounted.current) return;
      if (response.data.success) { toast.success(t("orders.deleteSuccess")); await fetchAllOrders(); }
      else toast.error(response.data.message || t("orders.deleteFailed"));
    } catch (error) {
      if (!isMounted.current) return;
      console.error("removeOrder error:", error);
      toast.error(error.response?.data?.message || t("orders.deleteError"));
    } finally {
      if (isMounted.current) setDeletingId(null);
    }
  };

  const handleReplied = (orderId, review) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, review } : o))
    );
  };

  useEffect(() => { fetchAllOrders(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && orders.length === 0) {
    return (
      <div className="order add">
        <h3>{t("orders.orderPage")}</h3>
        <div className="loading-spinner">{t("orders.loading")}</div>
      </div>
    );
  }

  return (
    <div className="order add">
      <h3>{t("orders.orderPage")}</h3>
      <div className="order-list">
        {orders.length === 0 && !loading && (
          <div className="no-orders">{t("orders.noOrdersFound")}</div>
        )}

        {orders.map((order) => {
          const hasFeedback =
            order.review && (order.review.rating || order.review.comment);

          return (
            <div key={order._id} className="order-item-wrapper">
              <div className="order-item">
                <img src={assets.parcel_icon} alt="parcel" />
                <div>
                  <p className="order-item-food">
                    <strong>{t("orders.foodName")}:</strong>{" "}
                    {order.items.map((item, idx) => (
                      <span key={idx}>
                        {item.name} x {item.quantity}
                        {idx !== order.items.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                  <p className="order-item-name">
                    <strong>{t("orders.customer")}:</strong> {order.address.fullName}
                  </p>
                  <div className="order-item-address">
                    <p><strong>{t("orders.address")}:</strong> {order.address.street}</p>
                    {order.address.houseNo && (
                      <p><strong>{t("orders.houseNo")}:</strong> {order.address.houseNo}</p>
                    )}
                    <p><strong>{t("orders.zipCode")}:</strong> {order.address.zipcode}</p>
                  </div>
                  <p className="order-item-phone">
                    <strong>{t("orders.phone")}:</strong> {order.address.phone}
                  </p>
                </div>
                <p>{t("orders.items")}: {order.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                <p><strong>{t("orders.total")}:</strong> {order.amount} {t("common.etb")}</p>
                <select
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status || "Pending Payment"}
                  disabled={deletingId === order._id || updatingId === order._id}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {t(status.labelKey)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeOrder(order._id)}
                  className="remove-order-btn"
                  disabled={deletingId === order._id || updatingId === order._id}
                >
                  {deletingId === order._id
                    ? t("orders.deleting")
                    : `🗑️ ${t("orders.remove")}`}
                </button>
              </div>

              {/* ───────── CUSTOMER FEEDBACK ───────── */}
              {hasFeedback && (
                <div className="order-feedback-panel">
                  <p className="order-feedback-label">💬 Customer feedback</p>

                  {order.review.rating && (
                    <span className="order-feedback-stars">
                      {"★".repeat(order.review.rating)}
                      {"☆".repeat(5 - order.review.rating)}
                    </span>
                  )}

                  {order.review.comment && (
                    <p className="order-feedback-comment">
                      "{order.review.comment}"
                    </p>
                  )}

                  {order.review.adminReply?.text ? (
                    <p className="order-feedback-replied">
                      ✅ Your reply: "{order.review.adminReply.text}"
                    </p>
                  ) : (
                    <ReplyBox order={order} onReplied={handleReplied} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;