import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";



function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow p-4">
                <Outlet /> 
            </main>
            {/* <Footer /> */}
        </div>
    );
}

export default Layout;
