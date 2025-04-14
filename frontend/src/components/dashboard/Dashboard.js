import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../Context/data-context';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import ChartWrapper from '../chart-wrapper/chart-wrapper';
import { barChart, lineChart, pieChart } from '../../utils/utils';
import { motion } from 'framer-motion';
import './Dashboard.css';

function Dashboard() {
  const { rfmData } = useContext(UserContext);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSegment, setSelectedSegment] = useState('All');
  const [loading, setLoading] = useState(false);
  const [filteredMonthlyRevenue, setFilteredMonthlyRevenue] = useState([]);
  const [filteredMonthlyCustomerAcquisition, setFilteredMonthlyCustomerAcquisition] = useState([]);
  const [filteredSegmentData, setFilteredSegmentData] = useState({});
  const [filteredGeographicalRevenue, setFilteredGeographicalRevenue] = useState([]);
  const [filteredTopProducts, setFilteredTopProducts] = useState([]);

  const {
    segmentData,
    monthlyRevenue,
    monthlyCustomerAcquisition,
    topProducts,
    geographicalRevenue,
  } = rfmData || {};

  // فلترة البيانات بناءً على السنة والـ Segment
  const filterData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    let filtered = data;

    if (selectedYear !== 'All') {
      filtered = filtered.filter(item => {
        const dateField = item.YearMonth || (item.InvoiceDate ? new Date(item.InvoiceDate) : null);
        if (!dateField) return false;
        const year = dateField instanceof Date ? dateField.getFullYear().toString() : new Date(dateField).getFullYear().toString();
        return year === selectedYear;
      });
    }

    if (selectedSegment !== 'All') {
      filtered = filtered.filter(item => item && item.Segment === selectedSegment);
    }

    return filtered;
  };

  useEffect(() => {
    setLoading(true);
    const filteredRev = filterData(monthlyRevenue);
    const filteredCust = filterData(monthlyCustomerAcquisition);
    const filteredGeo = filterData(geographicalRevenue);
    const filteredTop = filterData(topProducts);
    const filteredSeg = selectedSegment === 'All' 
      ? segmentData 
      : segmentData && segmentData[selectedSegment] 
        ? { [selectedSegment]: segmentData[selectedSegment] } 
        : {};

    setFilteredMonthlyRevenue(filteredRev);
    setFilteredMonthlyCustomerAcquisition(filteredCust);
    setFilteredGeographicalRevenue(filteredGeo);
    setFilteredTopProducts(filteredTop);
    setFilteredSegmentData(filteredSeg);
    setLoading(false);
  }, [selectedYear, selectedSegment, monthlyRevenue, monthlyCustomerAcquisition, geographicalRevenue, topProducts, segmentData]);

  const totalCustomers = monthlyCustomerAcquisition?.reduce(
    (sum, item) => sum + (item?.newCustomers || 0),
    0
  ) || 0;

  const avgRevenue = filteredMonthlyRevenue?.reduce(
    (sum, item) => sum + (item?.TotalPrice || 0),
    0
  ) / (filteredMonthlyRevenue?.length || 1) || 0;

  const monthlyGrowthRate = filteredMonthlyRevenue?.length > 1
    ? ((filteredMonthlyRevenue[filteredMonthlyRevenue.length - 1]?.TotalPrice || 0) -
        (filteredMonthlyRevenue[0]?.TotalPrice || 0)) /
        (filteredMonthlyRevenue[0]?.TotalPrice || 1) * 100
    : 0;

  const uniqueProducts = filteredTopProducts ? [...new Set(filteredTopProducts.map(item => item?.Description))].length : 0;

  const monthlyRevenueTrend = filteredMonthlyRevenue && filteredMonthlyRevenue.length > 0
    ? {
        labels: filteredMonthlyRevenue.map(item => item.YearMonth),
        datasets: [{
          label: 'Total Revenue',
          data: filteredMonthlyRevenue.map(item => item.TotalPrice || 0),
          borderColor: '#4e79a7',
          backgroundColor: 'rgba(78, 121, 167, 0.2)',
          fill: true,
          tension: 0.4,
        }],
      }
    : null;

  const customerAcquisitionTrend = filteredMonthlyCustomerAcquisition && filteredMonthlyCustomerAcquisition.length > 0
    ? {
        labels: filteredMonthlyCustomerAcquisition.map(item => item.YearMonth),
        datasets: [{
          label: 'New Customers',
          data: filteredMonthlyCustomerAcquisition.map(item => item.newCustomers || 0),
          backgroundColor: '#7EB77F',
        }],
      }
    : null;

  const totalCustomersBySegment = filteredSegmentData
    ? pieChart(
        Object.keys(filteredSegmentData),
        Object.values(filteredSegmentData).map(value => value?.length || 0)
      )
    : null;

  const revenueBreakdown = filteredTopProducts && Array.isArray(filteredTopProducts)
    ? {
        labels: [...new Set(filteredTopProducts.map(item => item?.Segment || 'Unknown'))],
        datasets: filteredTopProducts
          .reduce((acc, item) => {
            if (!item || !item.Description || typeof item.TotalPrice !== 'number') return acc;
            const segment = item.Segment || 'Unknown';
            const found = acc.find(dataset => dataset.label === item.Description);
            if (found) {
              found.data.push(item.TotalPrice);
            } else {
              acc.push({
                label: item.Description,
                data: [...new Set(filteredTopProducts.map(i => i?.Segment || 'Unknown'))].map(s => s === segment ? item.TotalPrice : 0),
                backgroundColor: segment === '(Blank)' ? '#4e79a7' : segment === 'Regular' ? '#4e79a7' : segment === 'Outliers' ? '#FFA987' : segment === 'VIP' ? '#7EB77F' : '#A98FCF',
              });
            }
            return acc;
          }, []),
      }
    : null;

  const revenueByCountry = filteredGeographicalRevenue && Array.isArray(filteredGeographicalRevenue)
    ? {
        labels: filteredGeographicalRevenue.map(item => item.Country),
        datasets: [{
          label: 'Revenue by Country',
          data: filteredGeographicalRevenue.map(item => item.TotalPrice || 0),
          backgroundColor: '#A98FCF',
        }],
      }
    : null;

  const years = monthlyRevenue && Array.isArray(monthlyRevenue)
    ? ['All', ...new Set(monthlyRevenue.map(item => item && new Date(item.YearMonth).getFullYear().toString()))]
    : ['All'];
  const segments = segmentData ? ['All', ...Object.keys(segmentData)] : ['All'];

  return (
    <motion.div
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-wrapper">
        <motion.div
          className="filters-sidebar"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Filters</h3>
          <div className="filter-group">
            <label>Date</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Segment</label>
            <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)}>
              {segments.map(segment => (
                <option key={segment} value={segment}>{segment}</option>
              ))}
            </select>
          </div>
        </motion.div>

        <div className="dashboard-content">
          <h1 className="dashboard-title">Customer Segmentation Dashboard</h1>

          <motion.div
            className="kpi-grid"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div className="kpi-card" whileHover={{ scale: 1.05 }}>
              <h3>Total Customers</h3>
              <p>{totalCustomers.toLocaleString()}</p>
            </motion.div>
            <motion.div className="kpi-card" whileHover={{ scale: 1.05 }}>
              <h3>Avg Revenue</h3>
              <p>${avgRevenue.toLocaleString()}</p>
            </motion.div>
            <motion.div className="kpi-card" whileHover={{ scale: 1.05 }}>
              <h3>Monthly Growth Rate</h3>
              <p>{monthlyGrowthRate.toFixed(2)}%</p>
            </motion.div>
            <motion.div className="kpi-card" whileHover={{ scale: 1.05 }}>
              <h3>Unique Products</h3>
              <p>{uniqueProducts.toLocaleString()}</p>
            </motion.div>
          </motion.div>

          <div className="dashboard-grid">
            <motion.div
              className="dashboard-card large-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2>Monthly Revenue Trend</h2>
              {loading ? (
                <div className="spinner">Loading...</div>
              ) : monthlyRevenueTrend && monthlyRevenueTrend.datasets[0].data.some(value => value > 0) ? (
                <ChartWrapper
                  ChartComponent={Line}
                  data={monthlyRevenueTrend}
                  options={{
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: (context) => `Revenue: $${context.parsed.y.toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      y: { beginAtZero: true },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          autoSkip: true,
                          maxTicksLimit: 10,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              ) : (
                <p>No revenue data available for selected filters</p>
              )}
            </motion.div>

            <motion.div
              className="dashboard-card large-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h2>Customer Acquisition Trend</h2>
              {loading ? (
                <div className="spinner">Loading...</div>
              ) : customerAcquisitionTrend && customerAcquisitionTrend.datasets[0].data.some(value => value > 0) ? (
                <ChartWrapper
                  ChartComponent={Bar}
                  data={customerAcquisitionTrend}
                  options={{
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: (context) => `New Customers: ${context.parsed.y}`,
                        },
                      },
                    },
                    scales: {
                      y: { beginAtZero: true },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          autoSkip: true,
                          maxTicksLimit: 10,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              ) : (
                <p>No acquisition data available for selected filters</p>
              )}
            </motion.div>

            <motion.div
              className="dashboard-card small-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <h2 style={{ fontSize: '1.2rem', color: '#4e79a7', marginBottom: '15px', textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.4' }}>
                Total Customers by Segment
              </h2>
              {loading ? (
                <div className="spinner">Loading...</div>
              ) : totalCustomersBySegment ? (
                <ChartWrapper
                  ChartComponent={Doughnut}
                  data={totalCustomersBySegment}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom', // نقل الـ legend لتحت
                        labels: {
                          boxWidth: 12,
                          padding: 6, // تقليل المسافة بين عناصر الـ legend
                          font: {
                            size: 10, // تصغير حجم الخط أكتر
                            family: "'Arial', sans-serif",
                          },
                          usePointStyle: true,
                        },
                      },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: (context) => `Customers: ${context.parsed}`,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                    cutout: '60%',
                    // تقليل حجم الـ chart نفسه
                    layout: {
                      padding: {
                        bottom: 40, // إضافة مساحة تحت للـ legend
                      },
                    },
                  }}
                />
              ) : (
                <p>No segment data available</p>
              )}
            </motion.div>

            <motion.div
              className="dashboard-card small-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <h2>Revenue Breakdown</h2>
              {loading ? (
                <div className="spinner">Loading...</div>
              ) : revenueBreakdown && revenueBreakdown.datasets.length > 0 ? (
                <ChartWrapper
                  ChartComponent={Bar}
                  data={revenueBreakdown}
                  options={{
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: (context) => `Revenue: $${context.parsed.y.toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true, beginAtZero: true },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              ) : (
                <p>No revenue breakdown data available</p>
              )}
            </motion.div>

            <motion.div
              className="dashboard-card small-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <h2>Revenue by Country</h2>
              {loading ? (
                <div className="spinner">Loading...</div>
              ) : revenueByCountry && revenueByCountry.datasets[0].data.some(value => value > 0) ? (
                <ChartWrapper
                  ChartComponent={Bar}
                  data={revenueByCountry}
                  options={{
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: (context) => `Revenue: $${context.parsed.y.toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      y: { beginAtZero: true },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          autoSkip: true,
                          maxTicksLimit: 5,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              ) : (
                <p>No geographical data available</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        © 2015 Customer Insights. All rights reserved.
      </footer>
    </motion.div>
  );
}

export default Dashboard;