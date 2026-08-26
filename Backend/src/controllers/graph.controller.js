import { CausalGraphService } from "../services/graph/CausalGraphService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getEnterpriseGraph = async (req, res, next) => {
  try {
    const graph = await CausalGraphService.buildEnterpriseGraph(req.query);
    return sendSuccess(res, graph, "SIF Precursor Causal Graph retrieved", 200);
  } catch (error) {
    next(error);
  }
};

export const getHighRiskPathways = async (req, res, next) => {
  try {
    const graph = await CausalGraphService.buildEnterpriseGraph(req.query);
    return sendSuccess(
      res,
      {
        count: graph.highRiskPathways.length,
        pathways: graph.highRiskPathways,
      },
      "High-Risk Precursor Causal Pathways retrieved",
      200
    );
  } catch (error) {
    next(error);
  }
};

export const getPrecursorGraph = async (req, res, next) => {
  try {
    const { type } = req.params;
    const graph = await CausalGraphService.buildEnterpriseGraph({ precursor: type.toUpperCase() });
    return sendSuccess(res, graph, `Causal subgraph for precursor ${type}`, 200);
  } catch (error) {
    next(error);
  }
};

export const getReportGraph = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const graph = await CausalGraphService.buildEnterpriseGraph({ reportId });
    return sendSuccess(res, graph, `Causal graph for report ${reportId}`, 200);
  } catch (error) {
    next(error);
  }
};

export default {
  getEnterpriseGraph,
  getHighRiskPathways,
  getPrecursorGraph,
  getReportGraph,
};
