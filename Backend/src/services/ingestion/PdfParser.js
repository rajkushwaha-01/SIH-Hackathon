import pdfParse from "pdf-parse";
import { TextParser } from "./TextParser.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class PdfParser {
  /**
   * Parse PDF buffer into text and structured fields.
   */
  static async parse(buffer, originalFileName = "report.pdf") {
    if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
      throw new AppError("Invalid or empty PDF buffer provided", 400, "INVALID_PDF_BUFFER");
    }

    try {
      const data = await pdfParse(buffer);
      const text = data.text;

      if (!text || !text.trim()) {
        throw new AppError("PDF contains no extractable text content", 400, "EMPTY_PDF_TEXT");
      }

      const parsedFields = TextParser.parse(text);

      logger.info(`PDF parsed successfully: ${originalFileName} (${data.numpages} pages)`);

      return {
        ...parsedFields,
        originalFileName,
        pageCount: data.numpages,
        info: data.info || {},
        rawText: text,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error parsing PDF ${originalFileName}:`, error);
      throw new AppError(`Failed to parse PDF document: ${error.message}`, 400, "PDF_PARSE_ERROR");
    }
  }
}

export default PdfParser;
