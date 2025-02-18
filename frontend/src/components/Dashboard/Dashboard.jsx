import React from "react";
import PieChart from "../charts/PieChart";
import BarChart from "../charts/BarChart";

export default function Dashboard() {
    return <>
        <h1 className="text-3xl font-bold  mb-8">Dashboard</h1>
        <div className="p-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 shadow-lg rounded-xl flex justify-center items-center">
                    <PieChart />
                </div>
                <div className="bg-white p-8 shadow-lg rounded-xl flex justify-center items-center">
                    <BarChart />
                </div>
            </div>
        </div>
    </>

}
