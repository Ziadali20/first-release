import React, { useContext } from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { UploadContext } from "../../context/UploadContext";


Chart.register(ArcElement, Tooltip, Legend);

export default function PieChart() {
    const { rfmData } = useContext(UploadContext);

    // console.log("rfmData:", JSON.stringify(rfmData, null, 2));

    if (!rfmData || Object.keys(rfmData).length === 0) {
        return <p className="text-red-500 text-center">No segment data available. Please upload a file.</p>;
    }

  
    const segmentCounts = {};
    Object.values(rfmData).forEach((customer) => {
        const segment = customer.segment;
        if (segment) {
            segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
        }
    });

    // console.log("Segment Counts:", segmentCounts);


    const labels = Object.keys(segmentCounts); 
    const values = Object.values(segmentCounts);

    const data = {
        labels,
        datasets: [
            {
                label: "Customer Segments",
                data: values,
                backgroundColor: [
                    "#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9966FF", "#FF9900"
                ],
                hoverBackgroundColor: [
                    "#FF4365", "#2392DB", "#E6B800", "#3E8E41", "#7748A2", "#CC6600"
                ],
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
        },
    };

    return (
        <div className="w-full h-[400px] flex flex-col justify-center items-center">
            <h2 className="text-xl font-bold text-center mb-4">Customer Segments</h2>
            <div className="w-full h-full flex justify-center items-center">
                <Pie data={data} options={options} />
            </div>
        </div>
    );
}
