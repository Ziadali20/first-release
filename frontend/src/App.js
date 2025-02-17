
import React, { useState } from "react";
import axios from "axios";

function App() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
            const response = await axios.post("http://localhost:5001/clean_csv", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            console.log("Cleaned JSON Response:", response.data);
        } catch (err) {
            setError("Error processing file. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>CSV Cleaner</h1>
            <h1>Test</h1>
            <h2>Test part2</h2>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <br />
            <button onClick={handleUpload} disabled={loading}>
                {loading ? "Processing..." : "Upload and Clean"}
            </button>

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default App;