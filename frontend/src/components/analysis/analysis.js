
import React, { useState, useContext } from "react";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import "chart.js/auto";
import { UserContext } from "../../Context/data-context";
import { FiUploadCloud } from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function Analysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("customer");
  const [useScaledRevenue, setUseScaledRevenue] = useState(false);
  const [currentPage, setCurrentPage] = useState({}); // Pagination state: { tableKey: pageNumber }
  const [searchQuery, setSearchQuery] = useState(""); // Search state
  const itemsPerPage = 10; // Number of items per page

  const { rfmData, setRfmData } = useContext(UserContext);

  const {
    segmentData,
    monthlyRevenue,
    dailyRevenue,
    topCustomers,
    topProducts,
    geographicalRevenue,
    monthlyCustomerAcquisition,
    heatmapData,
    churnPrediction,
    clv,
    affinityRules,
    sentimentSummary,
    inventoryTurnover,
    discountImpact,
    seasonalRevenue,
    retentionRate,
    salesDropFactors,
    repurchasePredictions,
    marketingRecommendations,
  } = rfmData;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:5001/upload_csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const endpoints = [
        "rfm_analysis",
        "monthly_revenue",
        "daily_revenue",
        "top_customers",
        "top_products",
        `geographical_analysis${useScaledRevenue ? "?scaled=true" : ""}`,
        "monthly_customer_acquisition",
        "customer_activity_heatmap",
        "churn_prediction",
        "customer_lifetime_value",
        "product_affinity",
        "sentiment_analysis",
        "inventory_turnover",
        "discount_impact",
        "seasonality_analysis",
        "retention_rate",
        "sales_drop_analysis",
        "repurchase_prediction",
        "marketing_recommendations",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint, index) =>
          axios
            .post(`http://localhost:5001/${endpoint}`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
            .catch((err) => {
              console.error(`Error calling ${endpoint}:`, err.message);
              return { error: `Failed to fetch ${endpoint}: ${err.message}` };
            })
        )
      );

      console.log("Responses:", responses);

      const failedEndpoints = responses
        .map((res, idx) => (res.error ? endpoints[idx] : null))
        .filter(Boolean);
      if (failedEndpoints.length > 0) {
        setError(`Failed to fetch data from: ${failedEndpoints.join(", ")}`);
      }

      setRfmData({
        segmentData: responses[0].data?.segment_data || {},
        monthlyRevenue: responses[1].data?.monthly_revenue || [],
        dailyRevenue: responses[2].data?.daily_revenue || {},
        topCustomers: responses[3].data?.top_customers || [],
        topProducts: responses[4].data?.top_products || [],
        geographicalRevenue: responses[5].data?.geographical_revenue || [],
        monthlyCustomerAcquisition: responses[6].data?.monthly_acquisition || [],
        heatmapData: responses[7].data?.activity_heatmap || [],
        churnPrediction: responses[8].data || {},
        clv: responses[9].data?.clv || [],
        affinityRules: responses[10].data?.affinity_rules || [],
        sentimentSummary: responses[11].data?.sentiment_summary || [],
        inventoryTurnover: responses[12].data?.inventory_turnover || [],
        discountImpact: responses[13].data?.discount_impact || [],
        seasonalRevenue: responses[14].data?.seasonal_revenue || [],
        retentionRate: responses[15].data?.retention_data || [],
        salesDropFactors: responses[16].data?.sales_drop_factors || [],
        repurchasePredictions: responses[17].data?.repurchase_predictions || [],
        marketingRecommendations:
          responses[18].data?.marketing_recommendations || [],
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Error processing file. Please try again.";
      setError(errorMessage);
      console.error("Upload Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination helper
  const paginateData = (data, tableKey) => {
    const page = currentPage[tableKey] || 1;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const handlePageChange = (tableKey, page) => {
    setCurrentPage((prev) => ({ ...prev, [tableKey]: page }));
  };

  // Filter data based on search query
  const filterData = (data, keys) => {
    if (!searchQuery) return data;
    return data?.filter((item) =>
      keys.some((key) =>
        String(item[key]).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  // Chart configurations
  const segmentPieChart = segmentData
    ? {
      labels: Object.keys(segmentData),
      datasets: [
        {
          data: Object.values(segmentData).map((value) => value?.length || 0),
          backgroundColor: [
            "#007bff",
            "#28a745",
            "#dc3545",
            "#ffc107",
            "#17a2b8",
          ],
        },
      ],
    }
    : null;

  const monthlyRevenueLine = monthlyRevenue
    ? {
      labels: monthlyRevenue.map((item) => item.YearMonth),
      datasets: [
        {
          label: "Revenue",
          data: monthlyRevenue.map((item) => item.TotalPrice),
          borderColor: "#007bff",
          fill: false,
        },
      ],
    }
    : null;

  const topCustomersBar = topCustomers
    ? {
      labels: topCustomers.map((item) => item.CustomerID),
      datasets: [
        {
          label: "Revenue",
          data: topCustomers.map((item) => item.TotalPrice),
          backgroundColor: "#28a745",
        },
      ],
    }
    : null;

  return (
    <div className="container-fluid py-4 bg-light">
      <div className="card shadow-lg mb-4">
        <div className="card-body p-4">
          <h1 className="text-center mb-4 text-primary">
            Customer & Sales Analytics Dashboard
          </h1>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            {["customer", "revenue", "product", "predictive"].map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
                </button>
              </li>
            ))}
          </ul>

          {/* File Upload */}
          <div className="row mb-4 justify-content-center">
            <div className="col-md-6">
              <div className="input-group">
                <label className="input-group-text">
                  <FiUploadCloud size={20} />
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="form-control"
                />
              </div>
              <button
                className={`btn btn-primary mt-3 w-100 ${loading ? "disabled" : ""
                  }`}
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                ) : null}
                {loading ? "Processing..." : "Upload & Analyze"}
              </button>
              {error && (
                <div className="alert alert-danger mt-3">{error}</div>
              )}
            </div>
          </div>

          {/* Key Insights Cards */}
          {activeTab === "customer" && (
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h5 className="card-title">Total Customers</h5>
                    <p className="card-text">
                      {Object.values(segmentData || {}).reduce(
                        (sum, seg) => sum + (seg?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h5 className="card-title">Top Segment</h5>
                    <p className="card-text">
                      {Object.entries(segmentData || {})
                        .sort((a, b) => b[1].length - a[1].length)[0]?.[0] ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-warning">
                  <div className="card-body">
                    <h5 className="card-title">High CLV Customers</h5>
                    <p className="card-text">
                      {clv?.filter((c) => c.CLV > (clv[0]?.CLV * 0.75 || 0))
                        .length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="tab-content">
            {/* Customer Tab */}
            {activeTab === "customer" && (
              <div className="row">
                {segmentPieChart && (
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Customer Segments</h5>
                        <Pie
                          data={segmentPieChart}
                          options={{ maintainAspectRatio: false }}
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {topCustomersBar && (
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Top Customers by Revenue</h5>
                        <Bar
                          data={topCustomersBar}
                          options={{ maintainAspectRatio: false }}
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {clv && (
                  <div className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Customer Lifetime Value</h5>
                        <input
                          type="text"
                          className="form-control mb-3"
                          placeholder="Search by CustomerID"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>CustomerID</th>
                                <th>CLV</th>
                                <th>Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginateData(
                                filterData(clv, ["CustomerID"]),
                                "clv"
                              ).map((item) => (
                                <tr key={item.CustomerID}>
                                  <td>{item.CustomerID}</td>
                                  <td>{item.CLV.toFixed(2)}</td>
                                  <td>{item.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <nav>
                          <ul className="pagination">
                            {Array.from({
                              length: Math.ceil(
                                filterData(clv, ["CustomerID"]).length /
                                itemsPerPage
                              ),
                            }).map((_, idx) => (
                              <li
                                key={idx}
                                className={`page-item ${(currentPage["clv"] || 1) === idx + 1
                                    ? "active"
                                    : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange("clv", idx + 1)
                                  }
                                >
                                  {idx + 1}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === "revenue" && (
              <div className="row">
                {monthlyRevenueLine && (
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Monthly Revenue</h5>
                        <Line
                          data={monthlyRevenueLine}
                          options={{ maintainAspectRatio: false }}
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {geographicalRevenue && (
                  <div className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Revenue by Country</h5>
                        <div className="form-check mb-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={useScaledRevenue}
                            onChange={() =>
                              setUseScaledRevenue(!useScaledRevenue)
                            }
                          />
                          <label className="form-check-label">
                            Use Scaled Revenue (Per Customer)
                          </label>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Country</th>
                                <th>
                                  {useScaledRevenue
                                    ? "Revenue per Customer"
                                    : "Total Revenue"}
                                </th>
                                <th>Customer Count</th>
                                <th>Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {geographicalRevenue.map((item) => (
                                <tr key={item.Country}>
                                  <td>{item.Country}</td>
                                  <td>
                                    {(useScaledRevenue
                                      ? item.RevenuePerCustomer
                                      : item.RawRevenue
                                    ).toFixed(2)}
                                  </td>
                                  <td>{item.CustomerCount}</td>
                                  <td>{item.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Tab */}
            {activeTab === "product" && (
              <div className="row">
                {topProducts && (
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Top Products by Revenue</h5>
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Revenue</th>
                                <th>Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topProducts.map((item) => (
                                <tr key={item.Description}>
                                  <td>{item.Description}</td>
                                  <td>{item.TotalPrice.toFixed(2)}</td>
                                  <td>{item.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {affinityRules && (
                  <div className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Product Affinity Rules</h5>
                        <input
                          type="text"
                          className="form-control mb-3"
                          placeholder="Search by Antecedents or Consequents"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Antecedents</th>
                                <th>Consequents</th>
                                <th>Support</th>
                                <th>Confidence</th>
                                <th>Lift</th>
                                <th>Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginateData(
                                filterData(affinityRules, [
                                  "antecedents",
                                  "consequents",
                                ]),
                                "affinityRules"
                              ).map((rule, index) => (
                                <tr key={index}>
                                  <td>{rule.antecedents}</td>
                                  <td>{rule.consequents}</td>
                                  <td>{rule.support.toFixed(2)}</td>
                                  <td>{rule.confidence.toFixed(2)}</td>
                                  <td>{rule.lift.toFixed(2)}</td>
                                  <td>{rule.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <nav>
                          <ul className="pagination">
                            {Array.from({
                              length: Math.ceil(
                                filterData(affinityRules, [
                                  "antecedents",
                                  "consequents",
                                ]).length / itemsPerPage
                              ),
                            }).map((_, idx) => (
                              <li
                                key={idx}
                                className={`page-item ${(currentPage["affinityRules"] || 1) === idx + 1
                                    ? "active"
                                    : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange("affinityRules", idx + 1)
                                  }
                                >
                                  {idx + 1}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Predictive Tab */}
            {activeTab === "predictive" && (
              <div className="row">
                {churnPrediction?.churn_predictions && (
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Churn Predictions</h5>
                        <input
                          type="text"
                          className="form-control mb-3"
                          placeholder="Search by CustomerID"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>CustomerID</th>
                                <th>Churn Probability</th>
                                <th>Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginateData(
                                filterData(churnPrediction.churn_predictions, [
                                  "CustomerID",
                                ]),
                                "churn_predictions"
                              ).map((item) => (
                                <tr key={item.CustomerID}>
                                  <td>{item.CustomerID}</td>
                                  <td>{item.Churn_Probability.toFixed(2)}</td>
                                  <td>{item.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <nav>
                          <ul className="pagination">
                            {Array.from({
                              length: Math.ceil(
                                filterData(churnPrediction.churn_predictions, [
                                  "CustomerID",
                                ]).length / itemsPerPage
                              ),
                            }).map((_, idx) => (
                              <li
                                key={idx}
                                className={`page-item ${(currentPage["churn_predictions"] || 1) ===
                                    idx + 1
                                    ? "active"
                                    : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange("churn_predictions", idx + 1)
                                  }
                                >
                                  {idx + 1}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
                {salesDropFactors && (
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Sales Drop Analysis</h5>
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>YearMonth</th>
                                <th>YoY Change</th>
                                <th>Reasons</th>
                                <th>Recommendations</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesDropFactors.map((item) => (
                                <tr key={item.YearMonth}>
                                  <td>{item.YearMonth}</td>
                                  <td>{(item.YoY_Change * 100).toFixed(2)}%</td>
                                  <td>{item.Reasons.join(", ")}</td>
                                  <td>{item.Recommendations.join(", ")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {repurchasePredictions && (
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Repurchase Predictions</h5>
                        <input
                          type="text"
                          className="form-control mb-3"
                          placeholder="Search by CustomerID"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>CustomerID</th>
                                <th>Repurchase Probability</th>
                                <th>Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginateData(
                                filterData(repurchasePredictions, ["CustomerID"]),
                                "repurchase_predictions"
                              ).map((item) => (
                                <tr key={item.CustomerID}>
                                  <td>{item.CustomerID}</td>
                                  <td>{item.Repurchase_Probability.toFixed(2)}</td>
                                  <td>{item.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <nav>
                          <ul className="pagination">
                            {Array.from({
                              length: Math.ceil(
                                filterData(repurchasePredictions, [
                                  "CustomerID",
                                ]).length / itemsPerPage
                              ),
                            }).map((_, idx) => (
                              <li
                                key={idx}
                                className={`page-item ${(currentPage["repurchase_predictions"] || 1) ===
                                    idx + 1
                                    ? "active"
                                    : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange(
                                      "repurchase_predictions",
                                      idx + 1
                                    )
                                  }
                                >
                                  {idx + 1}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
                {marketingRecommendations && (
                  <div className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Marketing Recommendations</h5>
                        <div className="accordion" id="marketingAccordion">
                          {marketingRecommendations.map((item, index) => (
                            <div className="accordion-item" key={item.Segment}>
                              <h2
                                className="accordion-header"
                                id={`heading${index}`}
                              >
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#collapse${index}`}
                                >
                                  {item.Segment} ({item.CustomerCount} Customers)
                                </button>
                              </h2>
                              <div
                                id={`collapse${index}`}
                                className="accordion-collapse collapse"
                                data-bs-parent="#marketingAccordion"
                              >
                                <div className="accordion-body">
                                  <p>
                                    <strong>Recommendation:</strong>{" "}
                                    {item.Recommendation}
                                  </p>
                                  <p>
                                    <strong>Top Customers:</strong>{" "}
                                    {item.TopCustomers.join(", ")}
                                  </p>
                                  <p>
                                    <strong>Product Bundles:</strong>{" "}
                                    {item.ProductBundles.join(", ")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis;