import express from "express";
import { addFood, listFood, removeFood, toggleAvailability, updateStock } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const foodRouter = express.Router();

// IMAGE storage engine
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

foodRouter.post("/add", upload.single('image'), addFood);
foodRouter.get("/list", listFood);
foodRouter.post("/remove", removeFood);
foodRouter.post("/toggle", authMiddleware, toggleAvailability); // enable/disable — just needs a logged-in token
foodRouter.post("/stock", authMiddleware, updateStock); // update stock quantity — admin only

export default foodRouter;
