import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./DailyReport.css";
import { toast } from "react-toastify";
import api from "../../services/api";

const PERIODS = [
  { key: "day", labelKey: "dailyReport.day" },
  { key: "week", labelKey: "dailyReport.week" },
  { key: "month", labelKey: "dailyReport.month" },
  { key: "year", labelKey: "dailyReport.year" },
];

const PREVIOUS_LABEL_KEY = {
  day: "dailyReport.yesterday",
  week: "dailyReport.lastWeek",
  month: "dailyReport.lastMonth",
  year: "dailyReport.lastYear",
};

const DailyReport = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("day");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const formatETB = (value) =>
    `${Math.round(value).toLocaleString()} ${t("common.etb")}`;

  const fetchReport = useCallback(async (targetPeriod, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get("/api/order/report", {
        params: { period: targetPeriod },
      });
      if (response.data.success) {
        setReport(response.data.data);
        setLastUpdated(new Date());
      } else {
        toast.error(response.data.message || "Error loading report");
      }
    } catch (error) {
      console.error("Report fetch error:", error);
      toast.error(error.response?.data?.message || "Error loading report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(period);
  }, [period, fetchReport]);

  const rangeLabel = (() => {
    if (!report) return "";
    const opts = { month: "short", day: "numeric" };
    const start = new Date(report.rangeStart);
    const end = new Date(report.rangeEnd);
    if (report.period === "day") {
      return start.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
    if (report.period === "year") {
      return start.getFullYear().toString();
    }
    if (report.period === "month") {
      return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
  })();

  if (loading) {
    return (
      <div className="daily-report">
        <div className="report-loading">
          <div className="report-spinner" />
          <p>{t("dailyReport.preparing", "Preparing the report...")}</p>
        </div>
      </div>
    );
  }

  const hasOrders = report && report.orderCount > 0;
  const topQuantity = hasOrders && report.bestSellingItems.length > 0
    ? report.bestSellingItems[0].quantity
    : 0;

  const change = report?.revenueChangePercent;
  const hasChange = typeof change === "number";
  const changeDirection = hasChange ? (change >= 0 ? "up" : "down") : null;
  const previousLabel = t(PREVIOUS_LABEL_KEY[period]);

  return (
    <div className="daily-report">
      <div className="report-header">
        <div className="report-heading-block">
          <span className="report-eyebrow">{t("dailyReport.eyebrow")}</span>
          <h1>{t("dailyReport.title")}</h1>
          <p className="report-date">{rangeLabel}</p>
        </div>
        <div className="report-header-actions">
          {lastUpdated && (
            <span className="report-updated">
              {t("dailyReport.updated", {
                time: lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              })}
            </span>
          )}
          <button
            className="refresh-btn"
            onClick={() => fetchReport(period, true)}
            disabled={refreshing}
          >
            {refreshing ? t("dailyReport.refreshing") : t("dailyReport.refresh")}
          </button>
        </div>
      </div>

      <div className="period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`period-tab ${period === p.key ? "period-tab-active" : ""}`}
            onClick={() => setPeriod(p.key)}
            disabled={loading}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {!hasOrders ? (
        <div className="report-empty">
          <p>{t("dailyReport.noOrdersYet")}</p>
          <p className="report-empty-sub">{t("dailyReport.figuresWillPopulate")}</p>
        </div>
      ) : (
        <>
          <div className="report-stats">
            <div className="stat-tile stat-tile-primary">
              <span className="stat-label">{t("dailyReport.revenue")}</span>
              <div className="stat-value-row">
                <span className="stat-value">{formatETB(report.totalRevenue)}</span>
                {hasChange && (
                  <span className={`stat-trend stat-trend-${changeDirection}`}>
                    <span className="stat-trend-arrow">{changeDirection === "up" ? "▲" : "▼"}</span>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                )}
              </div>
              {report.previousPeriodRevenue > 0 && (
                <span className="stat-subtext">
                  {t("dailyReport.vs", {
                    amount: formatETB(report.previousPeriodRevenue),
                    label: previousLabel,
                  })}
                </span>
              )}
            </div>
            <div className="stat-tile">
              <span className="stat-label">{t("dailyReport.orders")}</span>
              <span className="stat-value">{report.orderCount}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">{t("dailyReport.itemsSold")}</span>
              <span className="stat-value">{report.totalItemsSold}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">{t("dailyReport.averageOrder")}</span>
              <span className="stat-value">{formatETB(report.averageOrderValue)}</span>
            </div>
            {report.cancelledCount > 0 && (
              <div className="stat-tile stat-tile-muted">
                <span className="stat-label">{t("dailyReport.cancelled")}</span>
                <span className="stat-value">{report.cancelledCount}</span>
              </div>
            )}
          </div>

          <div className="report-section">
            <div className="report-section-header">
              <h2>{t("dailyReport.bestSellers")}</h2>
              <span className="report-section-sub">
                {t("dailyReport.rankedByUnits", { label: report.label })}
              </span>
            </div>
            <div className="bestsellers-list">
              {report.bestSellingItems.map((item, index) => {
                const revenueShare = report.totalRevenue > 0
                  ? (item.revenue / report.totalRevenue) * 100
                  : 0;
                return (
                  <div className="bestseller-row" key={item.name}>
                    <span className={`bestseller-rank ${index === 0 ? "bestseller-rank-top" : ""}`}>
                      {index + 1}
                    </span>
                    <div className="bestseller-info">
                      <div className="bestseller-top-line">
                        <span className="bestseller-name">{item.name}</span>
                        <span className="bestseller-qty">{t("dailyReport.sold", { count: item.quantity })}</span>
                      </div>
                      <div className="bestseller-bar-track">
                        <div
                          className="bestseller-bar-fill"
                          style={{
                            width: topQuantity > 0
                              ? `${(item.quantity / topQuantity) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                    </div>
                    <div className="bestseller-figures">
                      <span className="bestseller-revenue">{formatETB(item.revenue)}</span>
                      <span className="bestseller-share">
                        {t("dailyReport.percentOfSales", { percent: revenueShare.toFixed(0) })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyReport;
