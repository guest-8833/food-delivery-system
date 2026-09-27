import React, { useContext, useState, useRef, useEffect, useCallback } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Cart = () => {
  const {
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    clearCart,
    token,
    refreshFoodList,
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    houseNo: "",
    zipcode: "",
    phone: "",
    email: "",
  });

  const checkoutRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleAddressChange = useCallback((e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  }, []);

  const placeOrder = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!token) {
      alert("❌ You are not logged in! Please login first.");
      navigate("/");
      return;
    }

    if (!address.fullName || !address.street || !address.phone) {
      alert("Please fill in all address fields");
      return;
    }

    if (paymentMethod === "chapa" && !address.email) {
      alert("Email is required for Chapa payment");
      return;
    }

    setLoading(true);

    // Grab a fresh copy of stock right before submitting — food_list only
    // auto-refreshes on tab focus, so it can be stale by checkout time if
    // stock changed (another order, admin edit) while this tab was open.
    if (typeof refreshFoodList === "function") {
      try {
        await refreshFoodList();
      } catch (refreshError) {
        console.error("Could not refresh stock before checkout:", refreshError);
      }
    }

    let orderItems = [];
    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        const itemInfo = food_list.find((product) => product._id === itemId);
        if (itemInfo) {
          orderItems.push({
            _id: itemInfo._id,
            name: itemInfo.name,
            price: itemInfo.price,
            quantity: cartItems[itemId],
          });
        }
      }
    }

    if (orderItems.length === 0) {
      alert("No items in cart");
      setLoading(false);
      return;
    }

    const orderData = {
      items: orderItems,
      amount: getTotalCartAmount() + 2,
      address,
      paymentMethod,
    };

    try {
      const response = await axios.post(`${url}/api/order/place`, orderData, {
        headers: { token },
      });

      if (!isMounted.current) return;

      if (response.data.success) {
        if (paymentMethod === "chapa" && response.data.checkout_url) {
          localStorage.setItem("currentOrderId", response.data.orderId);
          window.location.href = response.data.checkout_url;
        } else {
          alert("✅ Order placed successfully! You will pay upon delivery.");
          clearCart();
          navigate("/myorders");
        }
      } else {
        // "Not enough stock" errors mean something changed since the page
        // loaded — refresh so the cart reflects real availability instead
        // of leaving the customer looking at numbers that are already wrong.
        const isStockError = response.data.message?.toLowerCase().includes("stock");
        if (isStockError && typeof refreshFoodList === "function") {
          await refreshFoodList();
          alert(
            `Sorry — "${response.data.message.replace(/^Not enough stock for /i, "").replace(/"/g, "")}" ` +
            `just ran out or dropped below what's in your cart. We've refreshed the menu — please check your cart quantities and try again.`
          );
        } else {
          alert("Error: " + response.data.message);
        }
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error("Place order error:", error);
      if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      } else {
        alert(error.response?.data?.message || "Error placing order");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const totalAmount = getTotalCartAmount();
  const deliveryFee = totalAmount === 0 ? 0 : 2;
  const finalTotal = totalAmount === 0 ? 0 : totalAmount + 2;

  if (totalAmount === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty 🛒</h2>
        <p>Add some delicious items to get started!</p>
        <button onClick={() => navigate("/")}>Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-items-title">
        <p>Item</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Adjust</p>
      </div>
      <br />
      {food_list.map((item) => {
        if (cartItems[item._id] && cartItems[item._id] > 0) {
          const atStockLimit =
            typeof item.stock === "number" && cartItems[item._id] >= item.stock;

          return (
            <div key={item._id}>
              <div className="cart-items-item cart-items-title">
                <img src={item.imageUrl} alt={item.name} loading="lazy" />
                <p>{item.name}</p>
                <p>{item.price} ETB</p>
                <div className="cart-quantity-controls">
                  <button onClick={() => removeFromCart(item._id)}>-</button>
                  <span>{cartItems[item._id]}</span>
                  <button
                    onClick={() => !atStockLimit && addToCart(item._id)}
                    disabled={atStockLimit}
                    style={atStockLimit ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                    title={atStockLimit ? "No more in stock" : undefined}
                  >
                    +
                  </button>
                </div>
                <p>{item.price * cartItems[item._id]} ETB</p>
                <p onClick={() => removeFromCart(item._id)} className="cross">❌</p>
              </div>
              {atStockLimit && (
                <p style={{ color: "#e63946", fontSize: "12px", margin: "-6px 0 6px 0" }}>
                  Only {item.stock} in stock — max reached
                </p>
              )}
              <hr />
            </div>
          );
        }
        return null;
      })}

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-deatails">
              <p>Subtotal</p>
              <p>{totalAmount} ETB</p>
            </div>
            <hr />
            <div className="cart-total-deatails">
              <p>Delivery Fee</p>
              <p>{deliveryFee} ETB</p>
            </div>
            <hr />
            <div className="cart-total-deatails">
              <b>Total</b>
              <b>{finalTotal} ETB</b>
            </div>
          </div>
          <button onClick={() => checkoutRef.current?.scrollIntoView({ behavior: "smooth" })} disabled={loading}>
            {loading ? "Processing..." : "PROCEED TO CHECKOUT"}
          </button>
        </div>

        <div className="cart-promocode" ref={checkoutRef}>
          <h2>Delivery Information</h2>
          <form onSubmit={placeOrder}>
            <input required name="fullName" onChange={handleAddressChange} value={address.fullName} type="text" placeholder="Full Name" autoComplete="name" />
            <input required name="street" onChange={handleAddressChange} value={address.street} type="text" placeholder="Address" autoComplete="street-address" />
            <input required name="houseNo" onChange={handleAddressChange} value={address.houseNo} type="text" placeholder="House No" autoComplete="off" />
            <input required name="zipcode" onChange={handleAddressChange} value={address.zipcode} type="text" placeholder="Zip Code" autoComplete="postal-code" />
            <input required name="phone" onChange={handleAddressChange} value={address.phone} type="tel" placeholder="Phone Number" autoComplete="tel" />
            <input name="email" onChange={handleAddressChange} value={address.email} type="email" placeholder="Email (required for Chapa)" autoComplete="email" />

            <div className="payment-method">
              <p>Payment Method</p>
              <label>
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} />
                Cash on Delivery
              </label>
              <label>
                <input type="radio" name="paymentMethod" value="chapa" checked={paymentMethod === "chapa"} onChange={(e) => setPaymentMethod(e.target.value)} />
                Chapa (Card / Telebirr / CBE)
              </label>
            </div>

            <button type="submit" disabled={loading} className="place-order-btn">
              {loading ? "Placing Order..." : `Place Order • ${finalTotal} ETB`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cart;
