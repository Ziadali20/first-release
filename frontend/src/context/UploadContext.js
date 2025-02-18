import React, { createContext, useState } from "react";
import axios from "axios";

export const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [rfmData, setRfmData] = useState(null); // تخزين البيانات

    const uploadFile = async (file) => {
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

            console.log("Received Data:", response.data.rfm_data);
            setRfmData(response.data.rfm_data); // حفظ البيانات في السياق
        } catch (err) {
            setError("Error processing file. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <UploadContext.Provider value={{ uploadFile, loading, error, rfmData }}>
            {children}
        </UploadContext.Provider>
    );
};
