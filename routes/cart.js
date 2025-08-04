import express from "express";
import {
  addToCart,
  deleteAllCartItems,
  getAllCartItems,
  updateCartItemQuantity,
} from "../controllers/cart.js";
import { protectRoute } from "../middleware/authMiddleware.js";
const cartRouter = express.Router();

cartRouter.post("/", protectRoute, addToCart);
cartRouter.get("/", protectRoute, getAllCartItems);
cartRouter.put("/:id", protectRoute, updateCartItemQuantity);
cartRouter.delete("/", protectRoute, deleteAllCartItems);

export default cartRouter;
