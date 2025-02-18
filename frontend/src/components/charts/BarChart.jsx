import React, { useContext } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { UploadContext } from "../../context/UploadContext";


Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BarChart() {
    const { rfmData } = useContext(UploadContext);

    // console.log("rfmData in BarChart:", rfmData); 

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

    // console.log("Segment Counts in BarChart:", segmentCounts); 
 
    const labels = Object.keys(segmentCounts);
    const values = Object.values(segmentCounts);

    const data = {
        labels,
        datasets: [
            {
                label: "Number of Customers",
                data: values,
                backgroundColor: "#36A2EB",
                hoverBackgroundColor: "#2392DB",
            },
        ],
    };

    const options = {
        responsive: true,
        scales: {
            y: { beginAtZero: true },
        },
        plugins: {
            legend: { display: false },
        },
    };

    return (
        <div className="w-full h-[400px] flex flex-col justify-center items-center">
        <h2 className="text-xl font-bold text-center mb-4">Customer Segments Distribution</h2>
        <div className="w-full h-full flex justify-center items-center">
            <Bar data={data} options={options} />
        </div>
    </div>
    
    );
}
