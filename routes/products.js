import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  recommendations,
  toggleFeaturedProduct,
  updateProduct,
} from "../controllers/products.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";
import photoUpload from "../middleware/photoUpload.js";
const productsRouter = express.Router();

productsRouter.get("/", getAllProducts);
productsRouter.post("/", protectRoute, adminRoute,photoUpload.single("image") ,  createProduct);
productsRouter.patch("/:id", protectRoute, adminRoute, updateProduct);
productsRouter.patch(
  "/:id/toggle-featured",
  protectRoute,
  adminRoute,
  toggleFeaturedProduct
);
productsRouter.get("/recommendations", recommendations);
productsRouter.get("/category/:category", getProductsByCategory);
productsRouter.get("/featured", getFeaturedProducts);
productsRouter.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default productsRouter;
