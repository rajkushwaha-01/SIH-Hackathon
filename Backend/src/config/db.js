import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    logger.info("MongoDB is already connected.");
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, MONGO_OPTIONS);
    isConnected = true;
    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    logger.error("MongoDB Connection Error:", error);
    // In development or test, we do not abruptly exit immediately so tests/mocks can run
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
    return null;
  }
};

export const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected gracefully.");
  }
};

export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB connection disconnected.");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB runtime error:", err);
});

export default connectDB;
