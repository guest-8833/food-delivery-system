import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");
    } catch (err) {
        console.log("DB Connection Error:", err);
        process.exit(1); // Exit process if DB fails to connect
    }
}