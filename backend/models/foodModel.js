import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 1 },
    isAvailable: { type: Boolean, default: true } // still overridable manually
}, { timestamps: true });

const foodModel = mongoose.models.food || mongoose.model("Food", foodSchema);
export default foodModel;
