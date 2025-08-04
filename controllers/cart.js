import Product from "../models/Product.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!user)
      return res.status(401).json({ message: "Unauthorized", success: false });
    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity++;
    } else {
      user.cartItems.push({ product: productId, quantity: 1 });
    }
    await user.save();
    res
      .status(200)
      .json({ message: "Item added to cart", success: true, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCartItems = async (req, res) => {
  try {
    const productIds = req.user.cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.product.toString() === product._id.toString()
      );
      return {
        ...product.toJSON(),
        quantity: item?.quantity || 1,
      };
    });

    res.status(200).json({ success: true, cartItems });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.product !== productId
        );
        await user.save();
        return res.json(user.cartItems);
      }

      existingItem.quantity = quantity;
      await user.save();
      res.json(user.cartItems);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const deleteAllCartItems = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (productId === null) {
      user.cartItems = [];
      await user.save();
      return res
        .status(200)
        .json({ message: "Cart cleared", success: true, user });
    } else {
      user.cartItems = user.cartItems.filter(
        (item) => item.product.toString() !== productId
      );
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Item removed from cart", success: true, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
