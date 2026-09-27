import express from "express";
import {
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
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/auth.js";

const orderRouter = express.Router();
orderRouter.get("/report", authMiddleware, getDailyReport);
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/webhook", chapaWebhook);
orderRouter.post("/verify", verifyPayment);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/details/:orderId", authMiddleware, getOrderDetails);
orderRouter.get("/list", authMiddleware, listOrders);
orderRouter.post("/status", authMiddleware, updateOrderStatus);
orderRouter.post("/remove", authMiddleware, removeOrder);
orderRouter.post("/review", authMiddleware, submitReview);
orderRouter.post("/review/reply", authMiddleware, replyToReview);
orderRouter.get("/daily-report", authMiddleware, getDailyReport);
orderRouter.get("/sales-report", authMiddleware, getSalesReport);

export default orderRouter;