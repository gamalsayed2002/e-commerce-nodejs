import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
    });
    return data;
  } catch (err) {
    return err;
  }
};
export const cloudinaryRemoveImage = async (imagePublicId) => {
  try {
    const data = await cloudinary.uploader.destroy(imagePublicId);
    return data;
  } catch (err) {
    return err;
  }
};

export default cloudinary;
