import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getCoupon, validateCoupon } from "../controllers/coupons.js";
const couponsRouter = express.Router();

couponsRouter.get("/", protectRoute, getCoupon);
couponsRouter.post("/validate", protectRoute,validateCoupon);

export default couponsRouter;
