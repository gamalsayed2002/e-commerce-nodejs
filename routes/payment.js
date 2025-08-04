import express from "express";
import { createCheckoutSession, success } from "../controllers/payment.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post(
  "/create-checkout-session",
  protectRoute,
  createCheckoutSession
);
paymentRouter.post("/checkout-success", success);

export default paymentRouter;