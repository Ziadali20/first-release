import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../Context/data-context';
import { motion } from 'framer-motion';
import { FaChartLine, FaUsers, FaProductHunt, FaGlobe, FaDatabase, FaCogs } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';

export default function Home() {
  const navigate = useNavigate();
  const { rfmData } = useContext(UserContext);

  const hasRfmResults =
    rfmData &&
    (rfmData.segmentData ||
      rfmData.monthlyRevenue ||
      rfmData.dailyRevenue ||
      rfmData.topCustomers ||
      rfmData.topProducts ||
      rfmData.geographicalRevenue||
      rfmData.monthlyCustomerAcquisition
    );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95 },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '100px 20px',
          background: 'linear-gradient(135deg, #4e79a7, #2c3e50)',
          color: 'white',
          borderRadius: '0 0 30px 30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <motion.h1
          style={{ fontSize: '3rem', marginBottom: '20px' }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {hasRfmResults ? 'Welcome Back!' : 'Unlock the Power of Customer Insights'}
        </motion.h1>
        <motion.p
          style={{ fontSize: '1.2rem', marginBottom: '40px' }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {hasRfmResults
            ? 'Your RFM analysis results are ready. Dive deeper into your customer insights.'
            : 'Upload your CSV file and discover actionable insights with RFM analysis. Understand your customers better and make data-driven decisions.'}
        </motion.p>
        <motion.button
          style={{
            padding: '15px 30px',
            fontSize: '1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#ff6f61',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 auto',
          }}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => navigate('/analysis')}
        >
          {hasRfmResults ? 'View Analysis' : 'Get Started'}
          <FiArrowRight />
        </motion.button>
      </div>

      <div
        style={{
          padding: '60px 10%',
          background: 'white',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2rem', color: '#4e79a7', marginBottom: '20px' }}>
          About the Project
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' }}>
          This project is designed to help businesses analyze customer behavior using RFM (Recency, Frequency, Monetary) analysis. By uploading a CSV file containing transaction data, you can gain valuable insights into customer segmentation, revenue trends, top-performing customers, and more. The tool leverages advanced data processing and visualization techniques to provide actionable insights for improving customer retention and boosting sales.
        </p>
      </div>

      <div
        style={{
          padding: '60px 10%',
          background: '#f5f7fa',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2rem', color: '#4e79a7', marginBottom: '40px' }}>
          Key Features
        </h2>
        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              icon: <FaChartLine size={40} color="#4e79a7" />,
              title: 'Customer Segmentation',
              description:
                'Group customers into segments based on their purchasing behavior. Identify high-value customers, at-risk customers, and more.',
            },
            {
              icon: <FaUsers size={40} color="#4e79a7" />,
              title: 'Top Customers',
              description:
                'Discover your most valuable customers and understand their purchasing patterns. Reward loyalty and improve retention.',
            },
            {
              icon: <FaProductHunt size={40} color="#4e79a7" />,
              title: 'Top Products',
              description:
                'Identify your best-selling products and optimize inventory management. Focus on products that drive the most revenue.',
            },
            {
              icon: <FaGlobe size={40} color="#4e79a7" />,
              title: 'Geographical Insights',
              description:
                'Analyze revenue trends across different regions. Understand where your customers are located and tailor marketing strategies accordingly.',
            },
            {
              icon: <FaDatabase size={40} color="#4e79a7" />,
              title: 'Data Visualization',
              description:
                'Interactive charts and graphs to visualize your data. Easily interpret complex data and make informed decisions.',
            },
            {
              icon: <FaCogs size={40} color="#4e79a7" />,
              title: 'Customizable Analysis',
              description:
                'Customize your analysis based on specific business needs. Filter data, adjust parameters, and generate tailored insights.',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              style={{
                flex: '1 1 30%',
                background: 'white',
                borderRadius: '15px',
                padding: '20px',
                margin: '10px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                textAlign: 'left',
              }}
              variants={cardVariants}
            >
              <div style={{ marginBottom: '15px' }}>{feature.icon}</div>
              <h3 style={{ color: '#4e79a7', marginBottom: '10px' }}>{feature.title}</h3>
              <p style={{ color: '#555' }}>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </motion.div>
  );
}