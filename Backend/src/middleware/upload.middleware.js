import multer from "multer";
import path from "path";
import { AppError } from "../utils/appError.js";

const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "text/x-csv",
  "application/x-csv",
  "text/comma-separated-values",
];

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `Unsupported file extension '${ext}'. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        400,
        "INVALID_FILE_TYPE"
      ),
      false
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && file.mimetype !== "application/octet-stream") {
    return cb(
      new AppError(
        `Unsupported MIME type '${file.mimetype}'. Please upload a valid PDF, CSV, or TXT document.`,
        400,
        "INVALID_MIME_TYPE"
      ),
      false
    );
  }

  cb(null, true);
};

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
    files: 1,
  },
  fileFilter,
}).single("file");

export const uploadSingleReport = uploadSingle;

export default uploadSingle;
