import React from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation(); // لمعرفة الصفحة الحالية

    return (
        <nav className="flex justify-between items-center p-4 bg-blue-600 text-white">
            <Link to="/">
            <h1 className="text-xl font-bold">My App</h1>
            </Link>
            <div>
                {location.pathname !== "/dashboard" && ( // إظهار زر الرفع فقط خارج الداشبورد
                    <Link to="/upload" className="px-4 py-2 bg-gray-200 text-blue-600 rounded">Upload</Link>
                )}
                <Link to="/dashboard" className="ml-4 px-4 py-2 bg-gray-200 text-blue-600 rounded">Dashboard</Link>
            </div>
        </nav>
    );
}

export default Navbar;
