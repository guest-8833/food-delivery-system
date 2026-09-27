import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    paymentMethod: { type: String, default: "chapa" },
    status: {
        type: String,
        default: "Pending Payment",
        enum: ["Pending Payment", "Food Processing", "Out for Delivery", "Delivered", "Cancelled"]
    },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false },
    paymentRef: { type: String },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        createdAt: { type: Date },
        adminReply: {
            text: { type: String, maxlength: 500 },
            repliedAt: { type: Date }
        }
    }
}, { timestamps: true });

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;