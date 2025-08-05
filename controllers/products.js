import { redis } from "../lib/redis.js";
import Product from "../models/Product.js";
import {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} from "./../lib/cloudinary.js";

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    // check if file exitsts
    if (!req.file) {
      return res.status(400).json({ msg: "no phpoto uploaded" });
    }

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const imagePath = path.join(
      __dirname,
      `../uploads/products/${req.file.filename}`
    );

    const result = await cloudinaryUploadImage(imagePath);

    const product = await Product.create({
      name,
      description,
      price,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
        local_url: `/uploads/products/${req.file.filename}`,
      },
      category,
    });

    return res.status(201).json(product);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const localPath = path.join(__dirname, "..", product.image.local_url);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    await cloudinaryRemoveImage(product.image.public_id);
    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const page = req.query.page || 0;
    const limit = req.query.limit || 10;
    const total = await Product.countDocuments({});
    const totalPages = Math.ceil(total / limit);
    const products = await Product.find({})
      .limit(limit)
      .skip(limit * page);
    res.json({ products, totalPages });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    const products = await Product.find({ isFeatured: true }).lean();
    if (!products) {
      return res.status(404).json({ message: "No featured products found" });
    }
    await redis.set("featured_products", JSON.stringify(products));
    return res.status(200).json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const recommendations = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: {
          size: 10,
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          image: 1,
          category: 1,
        },
      },
    ]);
    return res.status(200).json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    return res
      .status(200)
      .json({ products, category: req.params.category, success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    // First get the product to check if it exists and get current isFeatured value
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Toggle the isFeatured value
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isFeatured: !product.isFeatured },
      { new: true }
    );

    await updateFeaturedProductsCache();
    return res.status(200).json(updatedProduct);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (err) {
    console.log(err);
    // Removed res.status(500) here as res is not available in this scope
  }
}
