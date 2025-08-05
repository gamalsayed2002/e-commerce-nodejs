import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cartRouter from "./routes/cart.js";
import couponsRouter from "./routes/coupons.js";
import paymentRouter from "./routes/payment.js";
import analyticsRouter from "./routes/analytics.js";
dotenv.config({
  silent: true,
});

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials (cookies)
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/analytics", analyticsRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  connectDB();
});
// sadisbac
