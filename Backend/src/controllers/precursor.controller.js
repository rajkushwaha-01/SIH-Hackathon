import { PrecursorService } from "../services/precursor/PrecursorService.js";
import { Analysis } from "../models/Analysis.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getTaxonomy = (req, res) => {
  const taxonomy = PrecursorService.getTaxonomy();
  return sendSuccess(res, taxonomy, "14-Category Precursor Taxonomy retrieved", 200);
};

export const getPrecursorByType = (req, res, next) => {
  try {
    const definition = PrecursorService.getPrecursorByType(req.params.type);
    return sendSuccess(res, definition, `Precursor definition for ${req.params.type}`, 200);
  } catch (error) {
    next(error);
  }
};

export const getPrecursorAnalytics = async (req, res, next) => {
  try {
    const type = req.params.type.toUpperCase().trim();
    const definition = PrecursorService.getPrecursorByType(type);

    const reportCount = await Analysis.countDocuments({
      isLatest: true,
      "precursors.type": type,
    });

    const sifPotentialCount = await Analysis.countDocuments({
      isLatest: true,
      "precursors.type": type,
      "sifClassification.classification": "SIF_POTENTIAL",
    });

    return sendSuccess(
      res,
      {
        precursor: definition,
        totalOccurrences: reportCount,
        sifPotentialCount,
        sifRate: reportCount > 0 ? Math.round((sifPotentialCount / reportCount) * 100) : 0,
      },
      `Analytics for precursor ${type}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getTaxonomy,
  getPrecursorByType,
  getPrecursorAnalytics,
};
