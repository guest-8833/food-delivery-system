import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import axios from "axios";

const decrementStockForItems = async (items) => {
    for (const item of items) {
        const updated = await foodModel.findOneAndUpdate(
            { _id: item._id, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true }
        );

        if (!updated) {
            throw new Error(`Not enough stock for "${item.name}"`);
        }

        if (updated.stock <= 0 && updated.isAvailable) {
            updated.isAvailable = false;
            await updated.save();
        }
    }
};

const placeOrder = async (req, res) => {
    const frontend_url = process.env.FRONTEND_URL || "http://localhost:5174";
    const backend_url = process.env.BACKEND_URL || "http://localhost:4000";

    try {
        const userId = req.body.userId;
        const { items, amount, address, paymentMethod } = req.body;

        if (!userId || !items || !amount || !address) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        try {
            await decrementStockForItems(items);
        } catch (stockError) {
            return res.json({ success: false, message: stockError.message });
        }

        if (paymentMethod === "cod") {
            const newOrder = new orderModel({
                userId, items, amount, address,
                paymentMethod: "cod",
                status: "Food Processing",
                payment: true,
                date: new Date()
            });
            await newOrder.save();
            await userModel.findByIdAndUpdate(userId, { cartData: {} });
            return res.json({
                success: true,
                message: "Order placed successfully!",
                orderId: newOrder._id
            });
        }

        const newOrder = new orderModel({
            userId, items, amount, address,
            paymentMethod: "chapa",
            status: "Pending Payment",
            payment: false,
            date: new Date()
        });
        await newOrder.save();

        const tx_ref = "tx_" + newOrder._id + "_" + Date.now();
        await orderModel.findByIdAndUpdate(newOrder._id, { paymentRef: tx_ref });

        const user = await userModel.findById(userId);
        const customerEmail = user?.email || address?.email || "customer@example.com";

        const return_url = `${frontend_url}/payment-status?orderId=${newOrder._id}&tx_ref=${tx_ref}`;

        const paymentData = {
            amount: Math.round(amount).toString(),
            currency: "ETB",
            email: customerEmail,
            first_name: (address.firstName || "Customer").substring(0, 30),
            last_name: (address.lastName || "Name").substring(0, 30),
            tx_ref,
            callback_url: `${backend_url}/api/order/webhook`,
            return_url,
            customization: {
                title: "Zengena Food",
                description: `Order ${newOrder._id.toString().slice(-6)}`
            }
        };

        const chapaResponse = await axios.post(
            "https://api.chapa.co/v1/transaction/initialize",
            paymentData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        if (chapaResponse.data.status === "success") {
            return res.json({
                success: true,
                checkout_url: chapaResponse.data.data.checkout_url,
                orderId: newOrder._id
            });
        } else {
            await orderModel.findByIdAndDelete(newOrder._id);
            return res.json({
                success: false,
                message: chapaResponse.data.message || "Payment initialization failed"
            });
        }

    } catch (error) {
        console.error("Place order error:", error.response?.data || error.message);
        res.json({ success: false, message: "Error placing order. Please try again." });
    }
};

const chapaWebhook = async (req, res) => {
    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { tx_ref, status } = body;
        console.log("Webhook received:", { tx_ref, status });

        if (status === "success" && tx_ref) {
            const order = await orderModel.findOne({ paymentRef: tx_ref });
            if (order && !order.payment) {
                order.payment = true;
                order.status = "Food Processing";
                await order.save();
                await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
                console.log("✅ Order marked paid via webhook:", order._id);
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook error:", error);
        res.sendStatus(500);
    }
};

const verifyPayment = async (req, res) => {
    const { orderId, tx_ref } = req.body;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) return res.json({ success: false, message: "Order not found" });

        if (order.payment === true) {
            return res.json({ success: true, message: "Payment confirmed" });
        }

        const chapaResponse = await axios.get(
            `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
            {
                headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
                timeout: 15000
            }
        );

        if (chapaResponse.data.status === "success") {
            order.payment = true;
            order.status = "Food Processing";
            await order.save();
            await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
            return res.json({ success: true, message: "Payment verified!" });
        } else {
            return res.json({
                success: false,
                message: "Payment not completed. Status: " + chapaResponse.data.status
            });
        }
    } catch (error) {
        console.error("Verify error:", error.response?.data || error.message);
        return res.json({ success: false, message: "Verification failed: " + error.message });
    }
};

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({ userId: req.body.userId })
            .sort({ date: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error fetching orders" });
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.orderId);
        if (!order) return res.json({ success: false, message: "Order not found" });
        res.json({ success: true, data: order });
    } catch (error) {
        res.json({ success: false, message: "Error fetching order" });
    }
};

const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 });
        res.json({ success: true, data: orders, count: orders.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const validStatuses = [
            "Pending Payment", "Food Processing",
            "Out for Delivery", "Delivered", "Cancelled"
        ];
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, message: "Invalid status" });
        }
        const updated = await orderModel.findByIdAndUpdate(
            orderId, { status }, { new: true }
        );
        if (!updated) return res.json({ success: false, message: "Order not found" });
        res.json({ success: true, message: "Status updated", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const removeOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.json({ success: false, message: "Order ID required" });
        }

        const order = await orderModel.findByIdAndDelete(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order removed successfully" });
    } catch (error) {
        console.error("Remove order error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const submitReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;
        const userId = req.body.userId;

        const trimmedComment = (comment || "").trim().slice(0, 500);
        const hasRating = rating !== undefined && rating !== null && rating !== "";

        if (hasRating && (rating < 1 || rating > 5)) {
            return res.json({ success: false, message: "Rating must be between 1 and 5" });
        }
        if (!hasRating && !trimmedComment) {
            return res.json({ success: false, message: "Please add a rating or a comment" });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        // ✅ FIX: compare as strings so ObjectId/string/number types don't break equality
        if (order.userId.toString() !== String(userId)) {
            return res.status(403).json({ success: false, message: "Not authorized to review this order" });
        }

        if (order.status !== "Delivered") {
            return res.json({ success: false, message: "You can only review a delivered order" });
        }

        if (order.review && (order.review.rating || order.review.comment)) {
            return res.json({ success: false, message: "You've already submitted feedback for this order" });
        }

        order.review = {
            rating: hasRating ? rating : undefined,
            comment: trimmedComment,
            createdAt: new Date()
        };
        await order.save();

        res.json({ success: true, message: "Feedback submitted", review: order.review });
    } catch (error) {
        console.error("Submit review error:", error);
        res.status(500).json({ success: false, message: "Error submitting feedback" });
    }
};

const replyToReview = async (req, res) => {
    try {
        const { orderId, reply } = req.body;

        if (!orderId || !reply || !reply.trim()) {
            return res.json({ success: false, message: "Reply text is required" });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        if (!order.review || (!order.review.rating && !order.review.comment)) {
            return res.json({ success: false, message: "This order has no customer feedback to reply to" });
        }

        order.review.adminReply = {
            text: reply.trim().slice(0, 500),
            repliedAt: new Date()
        };
        await order.save();

        res.json({ success: true, message: "Reply sent", review: order.review });
    } catch (error) {
        console.error("Reply to review error:", error);
        res.status(500).json({ success: false, message: "Error sending reply" });
    }
};

const getPeriodRange = (period, now = new Date()) => {
    let start, end, prevStart, prevEnd, label;

    switch (period) {
        case "week": {
            const day = now.getDay();
            const diffToMonday = (day === 0 ? -6 : 1) - day;
            start = new Date(now);
            start.setDate(now.getDate() + diffToMonday);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);

            prevStart = new Date(start);
            prevStart.setDate(start.getDate() - 7);
            prevEnd = new Date(end);
            prevEnd.setDate(end.getDate() - 7);
            label = "This Week";
            break;
        }
        case "month": {
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            label = "This Month";
            break;
        }
        case "year": {
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

            prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            label = "This Year";
            break;
        }
        case "day":
        default: {
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);

            prevStart = new Date(start);
            prevStart.setDate(start.getDate() - 1);
            prevEnd = new Date(end);
            prevEnd.setDate(end.getDate() - 1);
            label = "Today";
            break;
        }
    }

    return { start, end, prevStart, prevEnd, label };
};

const getSalesReport = async (req, res) => {
    try {
        const period = ["day", "week", "month", "year"].includes(req.query.period)
            ? req.query.period
            : "day";

        const { start, end, prevStart, prevEnd, label } = getPeriodRange(period);

        const [currentOrders, previousOrders] = await Promise.all([
            orderModel.find({ date: { $gte: start, $lte: end } }),
            orderModel.find({ date: { $gte: prevStart, $lte: prevEnd } }),
        ]);

        const cancelledOrders = currentOrders.filter((o) => o.status === "Cancelled");
        const validOrders = currentOrders.filter((o) => o.status !== "Cancelled");
        const prevValidOrders = previousOrders.filter((o) => o.status !== "Cancelled");

        const totalRevenue = validOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const orderCount = validOrders.length;
        const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
        const previousPeriodRevenue = prevValidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

        let revenueChangePercent = null;
        if (previousPeriodRevenue > 0) {
            revenueChangePercent = ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
        } else if (totalRevenue > 0) {
            revenueChangePercent = 100;
        }

        const itemTotals = {};
        let totalItemsSold = 0;
        for (const order of validOrders) {
            for (const item of order.items || []) {
                if (!itemTotals[item.name]) {
                    itemTotals[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                }
                itemTotals[item.name].quantity += item.quantity || 0;
                itemTotals[item.name].revenue += (item.price || 0) * (item.quantity || 0);
                totalItemsSold += item.quantity || 0;
            }
        }

        const bestSellingItems = Object.values(itemTotals)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                period,
                label,
                rangeStart: start.toISOString(),
                rangeEnd: end.toISOString(),
                totalRevenue,
                orderCount,
                averageOrderValue,
                cancelledCount: cancelledOrders.length,
                previousPeriodRevenue,
                revenueChangePercent,
                totalItemsSold,
                bestSellingItems
            }
        });
    } catch (error) {
        console.error("Sales report error:", error);
        res.json({ success: false, message: "Error generating report" });
    }
};

const getDailyReport = (req, res) => {
    req.query.period = "day";
    return getSalesReport(req, res);
};

export {
    placeOrder,
    chapaWebhook,
    verifyPayment,
    userOrders,
    getOrderDetails,
    listOrders,
    updateOrderStatus,
    removeOrder,
    submitReview,
    replyToReview,
    getDailyReport,
    getSalesReport
};