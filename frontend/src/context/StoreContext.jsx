import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const url = "http://localhost:4000";

    const [cartItems, setCartItems] = useState({});
    const [food_list, setFoodList] = useState([]);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);

    // ✅ NEW: search term — shared so Navbar input and FoodDisplay filter stay in sync
    const [searchTerm, setSearchTerm] = useState("");

    // ✅ favorites state — load from localStorage on first render
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("favorites") || "{}");
        } catch {
            return {};
        }
    });

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ✅ persist favorites whenever they change
    useEffect(() => {
        try {
            localStorage.setItem("favorites", JSON.stringify(favorites));
        } catch (e) {
            console.error("save favorites error:", e);
        }
    }, [favorites]);

    const showNotification = useCallback((message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => {
            if (isMounted.current) setNotification(null);
        }, 3000);
    }, []);

    const toggleFavorite = useCallback((foodId) => {
        setFavorites((prev) => {
            const next = { ...prev };
            if (next[foodId]) {
                delete next[foodId];
            } else {
                next[foodId] = true;
            }
            return next;
        });
    }, []);

    const isFavorite = useCallback((foodId) => !!favorites[foodId], [favorites]);

    const favoriteCount = useMemo(
        () => Object.keys(favorites).length,
        [favorites]
    );

    const fetchFoodList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${url}/api/food/list`);
            if (!isMounted.current) return;
            if (response.data.success && response.data.data) {
                const foodsWithImageUrl = response.data.data.map((food) => ({
                    ...food,
                    imageUrl: `${url}/images/${food.image}`,
                }));
                setFoodList(foodsWithImageUrl);
            } else {
                setFoodList([]);
                setError("Failed to load food items");
            }
        } catch (error) {
            if (!isMounted.current) return;
            console.error("Error fetching food list:", error);
            setError(error.message || "Failed to connect to server");
            setFoodList([]);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [url]);

    const loadCartData = useCallback(async (authToken) => {
        if (!authToken) return;
        try {
            const response = await axios.post(`${url}/api/cart/get`, {}, {
                headers: { token: authToken },
            });
            if (!isMounted.current) return;
            if (response.data.success && response.data.cartData) {
                setCartItems(response.data.cartData);
            } else {
                setCartItems({});
            }
        } catch (error) {
            if (isMounted.current) {
                console.error("Error loading cart from backend:", error);
                setCartItems({});
            }
        }
    }, [url]);

    const addToCart = useCallback(async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
        if (token) {
            try {
                await axios.post(`${url}/api/cart/add`, { itemId }, { headers: { token } });
                showNotification("Item added to cart! 🛒", "success");
            } catch (error) {
                console.error("Error adding to cart:", error);
                setCartItems((prev) => {
                    const newCart = { ...prev };
                    if (newCart[itemId] > 1) newCart[itemId] -= 1;
                    else delete newCart[itemId];
                    return newCart;
                });
                showNotification("Failed to add item to cart", "error");
            }
        } else {
            showNotification("Item added! (Login to save permanently)", "info");
        }
    }, [token, url, showNotification]);

    const removeFromCart = useCallback(async (itemId) => {
        setCartItems((prev) => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) newCart[itemId] -= 1;
            else delete newCart[itemId];
            return newCart;
        });
        if (token) {
            try {
                await axios.post(`${url}/api/cart/remove`, { itemId }, { headers: { token } });
            } catch (error) {
                console.error("Error removing from cart:", error);
            }
        }
    }, [token, url]);

    const clearCart = useCallback(async () => {
        setCartItems({});
        if (token) {
            try {
                await axios.post(`${url}/api/cart/clear`, {}, { headers: { token } });
                showNotification("Cart cleared", "info");
            } catch (error) {
                console.error("Error clearing cart on backend:", error);
            }
        }
    }, [token, url, showNotification]);

    const getTotalCartAmount = useCallback(() => {
        let total = 0;
        for (const itemId in cartItems) {
            const qty = cartItems[itemId];
            const item = food_list.find(p => p._id === itemId);
            if (item) total += item.price * qty;
        }
        return total;
    }, [cartItems, food_list]);

    const getTotalCartItems = useCallback(() => {
        return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
    }, [cartItems]);

    useEffect(() => {
        fetchFoodList();
    }, [fetchFoodList]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchFoodList();
            }
        };

        const handleWindowFocus = () => {
            fetchFoodList();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [fetchFoodList]);

    const contextValue = useMemo(() => ({
        food_list,
        cartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        getTotalCartItems,
        clearCart,
        token,
        setToken,
        url,
        loading,
        error,
        notification,
        showNotification,
        refreshCart: () => token && loadCartData(token),
        refreshFoodList: fetchFoodList,

        // favorites API
        favorites,
        toggleFavorite,
        isFavorite,
        favoriteCount,

        // ✅ NEW: search API
        searchTerm,
        setSearchTerm,
    }), [
        food_list, cartItems, addToCart, removeFromCart, getTotalCartAmount,
        getTotalCartItems, clearCart, token, url, loading, error, notification,
        showNotification, loadCartData, fetchFoodList,
        favorites, toggleFavorite, isFavorite, favoriteCount,
        searchTerm,
    ]);

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;