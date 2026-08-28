import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("bufferCommands", false);

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let isConnected = false;

export const connectDB = async () => {
  if (!env.MONGODB_URI) {
    logger.error("MONGODB_URI is not configured.");
    return null;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info("MongoDB is already connected.");
    return mongoose.connection;
  }

  const sanitizedUri = env.MONGODB_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    "//$1:****@"
  );

  try {
    logger.info(`Connecting to MongoDB Atlas: ${sanitizedUri}`);

    const conn = await mongoose.connect(
      env.MONGODB_URI,
      MONGO_OPTIONS
    );

    isConnected = true;

    logger.info(
      `✓ MongoDB Atlas connected: ${conn.connection.host}/${conn.connection.name}`
    );

    return conn.connection;
  } catch (error) {
    isConnected = false;

    logger.error(
      `✗ MongoDB connection failed: ${error.message}`
    );

    return null;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected gracefully.");
  }
};

export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

mongoose.connection.on("connected", () => {
  isConnected = true;
  logger.info("MongoDB connection established.");
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB connection disconnected.");
});

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB runtime error: ${err.message}`);
});

export default connectDB;