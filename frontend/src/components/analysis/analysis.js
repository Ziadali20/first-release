import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import ChartWrapper from "../chart-wrapper/chart-wrapper";
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import { barChart, lineChart, pieChart, heatmapChart } from '../../utils/utils';
import 'chart.js/auto';
import 'chartjs-chart-matrix';
import { UserContext } from '../../Context/data-context';
import { motion } from 'framer-motion';
import { FiUploadCloud } from 'react-icons/fi';

function Analysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const heatmapRef = useRef(null);

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

      const rfmResponse = await axios.post("http://localhost:5001/rfm_analysis", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const revenueResponse = await axios.post("http://localhost:5001/monthly_revenue", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const dailyRevenueResponse = await axios.post("http://localhost:5001/daily_revenue", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const topCustomersResponse = await axios.post("http://localhost:5001/top_customers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const topProductsResponse = await axios.post("http://localhost:5001/top_products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const geographicalRevenueResponse = await axios.post("http://localhost:5001/geographical_analysis", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const test = await axios.post("http://localhost:5001/customer_activity_heatmap", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(test.data);

      const monthlyCustomerAcquisitionResponse = await axios.post("http://localhost:5001/monthly_customer_acquisition", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRfmData({
        segmentData: rfmResponse.data.segment_data,
        monthlyRevenue: revenueResponse.data.monthly_revenue,
        dailyRevenue: dailyRevenueResponse.data.daily_revenue,
        topCustomers: topCustomersResponse.data.top_customers,
        topProducts: topProductsResponse.data.top_products,
        geographicalRevenue: geographicalRevenueResponse.data.geographical_revenue,
        monthlyCustomerAcquisition: monthlyCustomerAcquisitionResponse.data.monthly_acquisition,
        // heatmapData: test.data,
      });

    } catch (err) {
      setError("Error processing file. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const segmentPieChart = segmentData ? pieChart(
    Object.keys(segmentData),
    Object.values(segmentData).map(value => value?.length)
  ) : null;
  const segmentBarChart = segmentData ? barChart(
    Object.keys(segmentData),
    Object.values(segmentData).map(value => value?.length),
    "Customer Segments"
  ) : null;

  const monthlyRevenueBar = monthlyRevenue ? barChart(
    monthlyRevenue?.map(item => item.YearMonth),
    monthlyRevenue?.map(item => item.TotalPrice),
    "Monthly revenue"
  ) : null;

  const monthlyCustomerAcquisitionLine = monthlyCustomerAcquisition ? lineChart(
    monthlyCustomerAcquisition?.map(item => item.YearMonth),
    monthlyCustomerAcquisition?.map(item => item.newCustomers),
    "New customers for each month"
  ) : null;

  const geographicalRevenueBar = geographicalRevenue ? barChart(
    geographicalRevenue?.map(item => item.Country),
    geographicalRevenue?.map(item => item.TotalPrice),
    "Revenue by country"
  ) : null;

  const topCustomersRevenueBar = topCustomers ? barChart(
    topCustomers?.map(item => item.CustomerID),
    topCustomers?.map(item => item.TotalPrice),
    "Top customers by revenue"
  ) : null;

  const topProductsRevenueBar = topProducts ? barChart(
    topProducts?.map(item => item.Description),
    topProducts?.map(item => item.TotalPrice),
    "Top products by revenue"
  ) : null;

  const dailyRevenueBar = dailyRevenue
    ? Object.keys(dailyRevenue).map((month) => {
      const days = Object.keys(dailyRevenue[month]);
      const revenues = days.map((day) => dailyRevenue[month][day]);
      return {
        month,
        data: barChart(days, revenues, `Daily Revenue (Bar) for ${month}`),
      };
    })
    : [];

  const dailyRevenueLine = dailyRevenue
    ? Object.keys(dailyRevenue).map((month) => {
      const days = Object.keys(dailyRevenue[month]);
      const revenues = days.map((day) => dailyRevenue[month][day]);
      return {
        month,
        data: lineChart(days, revenues, `Daily Revenue (Line) for ${month}`),
      };
    })
    : [];

  // const heatmap = heatmapData ? heatmapChart(heatmapData) : null;

  // useEffect(() => {
  //   if (heatmapData && heatmapRef.current) {
  //     const ctx = heatmapRef.current.getContext('2d');
  //     // تدمير الـ Chart القديم لو موجود
  //     if (heatmapRef.current.chart) {
  //       heatmapRef.current.chart.destroy();
  //     }
  //     // إنشاء الـ Heatmap الجديدة
  //     heatmapRef.current.chart = new ChartJS(ctx, {
  //       type: 'matrix',
  //       data: heatmap,
  //       options: heatmap.options
  //     });
  //   }

    // Cleanup
  //   return () => {
  //     if (heatmapRef.current?.chart) {
  //       heatmapRef.current.chart.destroy();
  //     }
  //   };
  // }, [heatmapData]);

  return (
    <motion.div
      style={{
        padding: '40px 10%',
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        minHeight: '100vh',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '2.5rem', color: '#4e79a7', marginBottom: '20px', textAlign: 'center' }}>
          CSV Cleaner and RFM Analysis
        </h1>

        {/* File Upload Section */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <label
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px dashed #4e79a7',
              color: '#4e79a7',
              cursor: 'pointer',
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            <FiUploadCloud size={20} style={{ marginRight: '10px' }} />
            {file ? file.name : "Choose a CSV file"}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Upload and Analyze Button */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <motion.button
            style={{
              padding: '15px 30px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#4e79a7',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload and Analyze"}
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            style={{
              color: 'red',
              textAlign: 'center',
              marginBottom: '20px',
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        {/* Heatmap كأول Chart
        {heatmapData && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ textAlign: 'center', color: '#4e79a7' }}>Customer Activity Heatmap</h2>
            <canvas ref={heatmapRef} style={{ maxHeight: '400px', width: '100%' }} />
          </div>
        )} */}

        {monthlyCustomerAcquisition && (
          <ChartWrapper title="New customers for each month" ChartComponent={Line} data={monthlyCustomerAcquisitionLine} />
        )}
        {segmentData && (
          <ChartWrapper title="Customer Segments" ChartComponent={Pie} data={segmentPieChart} />
        )}
        {segmentData && (
          <ChartWrapper title="Customer Segments" ChartComponent={Bar} data={segmentBarChart} />
        )}
        {monthlyRevenue && (
          <ChartWrapper title="Monthly Revenue" ChartComponent={Bar} data={monthlyRevenueBar} />
        )}
        {topCustomers && (
          <ChartWrapper title="Top Customers by Revenue" ChartComponent={Bar} data={topCustomersRevenueBar} />
        )}
        {topProducts && (
          <ChartWrapper title="Top Products by Revenue" ChartComponent={Bar} data={topProductsRevenueBar} />
        )}
        {geographicalRevenue && (
          <ChartWrapper title="Revenue by Country" ChartComponent={Bar} data={geographicalRevenueBar} />
        )}

        {dailyRevenueBar.map((chart, index) => (
          <React.Fragment key={index}>
            <ChartWrapper
              title={`Daily Revenue (Bar) for ${chart.month}`}
              ChartComponent={Bar}
              data={chart.data}
            />
            <ChartWrapper
              title={`Daily Revenue (Line) for ${chart.month}`}
              ChartComponent={Line}
              data={dailyRevenueLine[index].data}
            />
          </React.Fragment>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Analysis;

