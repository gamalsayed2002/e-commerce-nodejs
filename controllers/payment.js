import Stripe from "stripe";
import dotenv from "dotenv";
import { stripe } from "../lib/stripe.js";
import Coupon from "../models/Coupon.js";
import Order from "./../models/Order.js";
dotenv.config();

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "inbvalid or empty products array",
      });
    }
    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // stripe want the price from the dolar to cents
      totalAmount += amount * product.quantity;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
            description: product.description,
          },
          unit_amount: amount,
        },
        quantity: product.quantity,
      };
    });
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= (totalAmount * coupon.discountPercentage) / 100;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
            name: p.name,
            image: p.image,
            description: p.description,
          }))
        ),
      },
    });
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({
      success: true,
      message: "Checkout session endpoint is working",
      id: session.id,
      totalAmount: totalAmount / 100,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}
async function createNewCoupon(userId) {
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userId,
  });
  await newCoupon.save();
  return newCoupon;
}
export const success = async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log("Received request for session ID:", sessionId);

    if (!sessionId) {
      console.log("No session ID provided in request");
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(
      "Retrieved session:",
      session.id,
      "with status:",
      session.payment_status
    );

    if (session.payment_status !== "paid") {
      console.log("Payment not completed for session:", session.id);
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    console.log("Processing paid session:", session.id);

    // Only deactivate coupon if it exists in the session metadata
    if (session.metadata?.couponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: session.metadata.couponCode,
          userId: session.metadata.userId,
        },
        {
          isActive: false,
        }
      );
    }

    const products = JSON.parse(session.metadata.products);
    const newOrder = new Order({
      user: session.metadata.userId,
      products: products.map((product) => ({
        product: product.id,
        quantity: product.quantity,
        price: product.price,
      })),
      totalAmount: session.amount_total / 100,
      paymentIntentId: session.payment_intent,
      stripeSessionId: session.id,
    });
    await newOrder.save();

    console.log("Order created successfully:", newOrder._id);

    res.status(200).json({
      success: true,
      message: "Payment successful",
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Error in success endpoint:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + err.message,
    });
  }
};
