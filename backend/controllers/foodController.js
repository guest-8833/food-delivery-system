import foodModel from "../models/foodModel.js";
import fs from "fs";

const addFood = async (req, res) => {
    if (!req.file) {
        return res.json({ success: false, message: "No image uploaded" });
    }

    // Stock is no longer collected on the Add form — default new items to 1
    // instead of rejecting the upload when it's missing.
    let stock = Number(req.body.stock);
    if (isNaN(stock) || stock < 0) {
        stock = 1;
    }

    const image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename,
        stock,
        isAvailable: stock > 0
    });

    try {
        await food.save();
        res.json({ success: true, message: "Food Added" });
    } catch (error) {
        console.log(error);
        if (req.file) {
            fs.unlink(`uploads/${req.file.filename}`, () => {});
        }
        res.json({ success: false, message: "Error" });
    }
};

const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (!food) {
            return res.json({ success: false, message: "Food not found" });
        }
        fs.unlink(`uploads/${food.image}`, (err) => {
            if (err) console.log("Error deleting file:", err);
        });
        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const toggleAvailability = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (!food) {
            return res.json({ success: false, message: "Food not found" });
        }

        food.isAvailable = !food.isAvailable;
        await food.save();

        res.json({
            success: true,
            message: `"${food.name}" is now ${food.isAvailable ? "enabled" : "disabled"}`,
            isAvailable: food.isAvailable
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating availability" });
    }
};

// Updates just the stock quantity for a food item.
// Keeps isAvailable independent/manual, matching how the admin List page
// treats them as two separate controls.
const updateStock = async (req, res) => {
    try {
        const { id, stock } = req.body;

        if (!id) {
            return res.json({ success: false, message: "Food id is required" });
        }

        const stockNum = Number(stock);
        if (isNaN(stockNum) || stockNum < 0) {
            return res.json({ success: false, message: "Please provide a valid stock quantity" });
        }

        const food = await foodModel.findById(id);
        if (!food) {
            return res.json({ success: false, message: "Food not found" });
        }

        food.stock = stockNum;
        await food.save();

        res.json({
            success: true,
            message: `Stock updated to ${stockNum}`,
            stock: food.stock
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating stock" });
    }
};

export { addFood, listFood, removeFood, toggleAvailability, updateStock };
