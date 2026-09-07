import api from "./client";

export const analysis = {
  getTopSetups: () => api.get("/analysis/top-setups/"),
  getEcoSurprise: () => api.get("/analysis/eco-surprise/"),
  getEconomicStrength: () => api.get("/analysis/economic-strength/"),
  getMonthlySeasonality: (pair) =>
    api.get("/analysis/seasonality/monthly/", { params: { pair } }),
  getAnnualSeasonality: (pair) =>
    api.get("/analysis/seasonality/annual/", { params: { pair } }),
  getEconomicHeatmap: (currency) =>
    api.get("/analysis/economic-heatmap/", { params: { currency } }),
  getLatestCOT: () => api.get("/analysis/cot/latest/"),
  getCOTTrends: (assets) => {
    const params = new URLSearchParams();
    params.append("assets", assets.join(","));
    return api.get("/analysis/cot/trends/", { params });
  },
  getCOTHistory: (asset) =>
    api.get("/analysis/cot/history/", { params: { asset } }),
  getRetailSentiment: () => api.get("/analysis/retail/"),
  getPutCallRatio: (ticker) =>
    api.get("/analysis/put-call/", { params: { ticker } }),
  getEconomicCalendar: () => api.get("/analysis/economic-calendar/"),
  getAssetScorecard: (asset) =>
    api.get("/analysis/asset-scorecard/", { params: { asset } }),
  getForexScorecard: (pair) =>
    api.get("/analysis/forex-scorecard/", { params: { pair } }),
  refreshIndicators: (currency) =>
    api.post("/admin/refresh-indicators/", { currency }),
};
