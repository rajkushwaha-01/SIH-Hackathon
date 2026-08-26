import crypto from "crypto";

/**
 * Normalizes text content for deterministic content hashing.
 * Removes extra whitespaces, line breaks, and punctuation noise.
 */
export const normalizeTextForHashing = (text = "") => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "") // Remove punctuation
    .replace(/\s+/g, " ")     // Collapse whitespace
    .trim();
};

/**
 * Generates a SHA-256 hash from text content.
 */
export const generateContentHash = (content = "") => {
  const normalized = normalizeTextForHashing(content);
  return crypto.createHash("sha256").update(normalized).digest("hex");
};

/**
 * Generates a unique, human-readable safety report ID (e.g. INC-2026-8742).
 */
export const generateReportId = (prefix = "INC") => {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `${prefix}-${year}-${randomSuffix}`;
};

export default {
  normalizeTextForHashing,
  generateContentHash,
  generateReportId,
};
