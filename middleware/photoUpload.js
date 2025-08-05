import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

// إصلاح __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/products"));
  },
  filename: function (req, file, cb) {
    if (file) {
      cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname);
    } else {
      cb(null, false);
    }
  },
});

const photoUpload = multer({
  storage: photoStorage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb({ msg: "Unsupported file format" }, false);
    }
  },
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

export default photoUpload;
