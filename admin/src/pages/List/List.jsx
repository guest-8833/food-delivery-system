import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./List.css";
import { toast } from "react-toastify";
import api, { API_BASE_URL } from "../../services/api";

const MAX_STOCK = 9999;

const List = () => {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Local in-progress edits for stock inputs, keyed by food id.
  // Value is a string (the raw input) until saved.
  const [stockEdits, setStockEdits] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);

  // Tracks the item that was just switched to Enabled, so we can
  // auto-focus its quantity input right away.
  const [justEnabledId, setJustEnabledId] = useState(null);
  const stockInputRefs = useRef({});

  const fetchList = async () => {
    try {
      const response = await api.get("/api/food/list");
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error(response.data.message || "Error fetching list");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.response?.data?.message || "Error fetching list");
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId) => {
    if (!window.confirm(t("list.deleteConfirm"))) {
      return;
    }

    setDeletingId(foodId);

    try {
      const response = await api.post("/api/food/remove", { id: foodId });

      if (response.data.success) {
        toast.success(response.data.message || "Food item removed successfully");
        await fetchList();
      } else {
        toast.error(response.data.message || "Error removing item");
      }
    } catch (error) {
      console.error("Remove error:", error);
      if (error.isAuthError) {
        toast.error("Unauthorized. Please login as admin.");
      } else {
        toast.error(error.response?.data?.message || "Error removing item");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailability = async (foodId) => {
    setTogglingId(foodId);

    try {
      const response = await api.post("/api/food/toggle", { id: foodId });

      if (response.data.success) {
        toast.success(response.data.message);
        setList((prevList) =>
          prevList.map((item) =>
            item._id === foodId
              ? { ...item, isAvailable: response.data.isAvailable }
              : item
          )
        );
        if (response.data.isAvailable) {
          setJustEnabledId(foodId);
        }
      } else {
        toast.error(response.data.message || "Error updating availability");
      }
    } catch (error) {
      console.error("Toggle error:", error);
      if (error.isAuthError) {
        toast.error("Unauthorized. Please login as admin.");
      } else {
        toast.error(error.response?.data?.message || "Error updating availability");
      }
    } finally {
      setTogglingId(null);
    }
  };

  // Stock shown for an item: an in-progress edit if there is one,
  // otherwise the saved value. Only truly-missing stock (not a number)
  // defaults to 1 — a real 0 means genuinely out of stock.
  const getStockDisplayValue = (item) => {
    if (stockEdits[item._id] !== undefined) return stockEdits[item._id];
    return typeof item.stock === "number" ? String(item.stock) : "1";
  };

  const handleStockInputChange = (itemId, value) => {
    // Allow empty (while typing) or digits only, capped at MAX_STOCK
    if (value === "" || (/^\d+$/.test(value) && Number(value) <= MAX_STOCK)) {
      setStockEdits((prev) => ({ ...prev, [itemId]: value }));
    }
  };

  const clearStockEdit = (itemId) => {
    setStockEdits((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const saveStock = async (item) => {
    const rawValue = stockEdits[item._id];
    if (rawValue === undefined) return; // nothing changed, nothing to save

    const currentStock = typeof item.stock === "number" ? item.stock : 1;
    const newStock = rawValue === "" ? 1 : Number(rawValue);

    if (newStock === currentStock) {
      clearStockEdit(item._id);
      return;
    }

    setSavingStockId(item._id);

    try {
      const response = await api.post("/api/food/stock", {
        id: item._id,
        stock: newStock,
      });

      if (response.data.success) {
        setList((prevList) =>
          prevList.map((food) =>
            food._id === item._id ? { ...food, stock: newStock } : food
          )
        );
        toast.success(t("list.stockUpdated"));
      } else {
        toast.error(response.data.message || "Error updating stock");
      }
    } catch (error) {
      console.error("Stock update error:", error);
      if (error.isAuthError) {
        toast.error("Unauthorized. Please login as admin.");
      } else {
        toast.error(error.response?.data?.message || "Error updating stock");
      }
    } finally {
      setSavingStockId(null);
      clearStockEdit(item._id);
    }
  };

  const handleStockKeyDown = (event) => {
    if (event.key === "Enter") {
      event.target.blur(); // triggers onBlur -> saveStock
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // After an item becomes Enabled, jump straight into its quantity
  // field so the admin can type the number right away.
  useEffect(() => {
    if (!justEnabledId) return;
    const input = stockInputRefs.current[justEnabledId];
    if (input) {
      input.focus();
      input.select();
    }
    setJustEnabledId(null);
  }, [justEnabledId, list]);

  if (loading) {
    return (
      <div className="list add flex-col">
        <div className="loading-container">
          <div className="spinner" />
          <p>{t("list.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list add flex-col">
      <div className="list-header">
        <p>{t("list.allFoodsList")}</p>
        <span className="item-count">{t("list.total", { count: list.length })}</span>
      </div>

      <div className="list-table-format title">
        <b>{t("list.image")}</b>
        <b>{t("list.name")}</b>
        <b>{t("list.priceStock")}</b>
        <b>{t("list.status")}</b>
        <b>{t("list.action")}</b>
      </div>

      {list.length === 0 ? (
        <div className="no-items">
          <p>{t("list.noItemsFound")}</p>
        </div>
      ) : (
        list.map((item, index) => {
          const isAvailable = item.isAvailable !== false;
          return (
            <div
              key={item._id || index}
              className={`list-table-format ${!isAvailable ? "item-disabled" : ""}`}
            >
              <img
                src={`${API_BASE_URL}/images/${item.image}`}
                alt={item.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/50?text=No+Image";
                }}
              />
              <p>{item.name}</p>

              <div className="price-stock-cell">
                <span className="price-text">{item.price} {t("common.etb")}</span>
                {isAvailable ? (
                  <span className="stock-inline">
                    <input
                      ref={(el) => {
                        stockInputRefs.current[item._id] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      className={`stock-input ${savingStockId === item._id ? "saving" : ""}`}
                      value={getStockDisplayValue(item)}
                      disabled={savingStockId === item._id}
                      onChange={(e) => handleStockInputChange(item._id, e.target.value)}
                      onBlur={() => saveStock(item)}
                      onKeyDown={handleStockKeyDown}
                      aria-label={`Stock for ${item.name}`}
                    />
                    <span className="stock-label">{t("list.inStock")}</span>
                    {item.stock === 0 && (
                      <span className="stock-status-badge out-of-stock">{t("list.outOfStock")}</span>
                    )}
                  </span>
                ) : (
                  <span className="stock-placeholder">{t("list.disabledNoQuantity")}</span>
                )}
              </div>

              <label
                className={`toggle-switch ${togglingId === item._id ? "toggling" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isAvailable}
                  disabled={togglingId === item._id}
                  onChange={() => toggleAvailability(item._id)}
                />
                <span className="toggle-slider" />
                <span className="toggle-status-text">
                  {togglingId === item._id ? "..." : isAvailable ? t("list.enabled") : t("list.disabled")}
                </span>
              </label>

              <p
                onClick={() => removeFood(item._id)}
                className={`cursor ${deletingId === item._id ? "deleting" : ""}`}
                style={{
                  cursor: deletingId === item._id ? "not-allowed" : "pointer",
                  opacity: deletingId === item._id ? 0.5 : 1,
                }}
              >
                {deletingId === item._id ? "⏳" : "✖"}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

export default List;
