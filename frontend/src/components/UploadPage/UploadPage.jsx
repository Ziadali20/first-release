import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadContext } from "../../context/UploadContext";


function UploadPage() {
    const { uploadFile, loading, error } = useContext(UploadContext);
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        await uploadFile(file);
        navigate("/dashboard"); // توجيه المستخدم بعد الرفع
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Upload Your CSV File</h1>
            <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
            <button 
                onClick={handleUpload} 
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                {loading ? "Processing..." : "Upload and Proceed"}
            </button>

            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
}

export default UploadPage;
