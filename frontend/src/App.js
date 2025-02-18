import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UploadProvider } from "./context/UploadContext";
import Dashboard from "./components/Dashboard/Dashboard";
import UploadPage from "./components/UploadPage/UploadPage";
import Layout from "./components/Layout/Layout";
import Home from "./components/Home/Home";

function App() {
    return (

        <UploadProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} /> {/* اجعل Home الصفحة الرئيسية */}
                        <Route path="upload" element={<UploadPage />} /> {/* صفحة رفع الملف */}
                        <Route path="dashboard" element={<Dashboard />} />
                    </Route>
                </Routes>
            </Router>
        </UploadProvider>

    );
}

export default App;
