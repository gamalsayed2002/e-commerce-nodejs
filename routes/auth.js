import express from "express";
import {
  getProfile,
  login,
  logout,
  refresh,
  signup,
} from "../controllers/auth.js";
import { protectRoute } from "../middleware/authMiddleware.js";
const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);
authRouter.get("/profile", protectRoute, getProfile);

export default authRouter;
