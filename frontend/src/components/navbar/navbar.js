import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChartLine, FaDatabase, FaEnvelope, FaBars, FaTimes, FaTachometerAlt } from 'react-icons/fa';
import './navbar.css';

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <nav className={`custom-navbar ${isSidebarOpen ? 'open' : ''}`}>
        <ul className="navbar-list">
          <li className="navbar-item">
            <Link to="/" className="navbar-link" onClick={toggleSidebar}>
              <FaHome className="navbar-icon" />
              <span>Home</span>
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/analysis" className="navbar-link" onClick={toggleSidebar}>
              <FaChartLine className="navbar-icon" />
              <span>Analysis</span>
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/user-data" className="navbar-link" onClick={toggleSidebar}>
              <FaDatabase className="navbar-icon" />
              <span>Data</span>
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/send-emails" className="navbar-link" onClick={toggleSidebar}>
              <FaEnvelope className="navbar-icon" />
              <span>Connect</span>
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/dashboard" className="navbar-link" onClick={toggleSidebar}>
              <FaTachometerAlt className="navbar-icon" />
              <span>Dashboard</span>
            </Link>
          </li>
        </ul>
      </nav>

      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
}