const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS
app.use(cors());

// Helper function to send file to Flask backend
const sendFileToFlask = async (filePath, originalname, mimetype, endpoint) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
        filename: originalname,
        contentType: mimetype,
    });

    const response = await axios.post(http://localhost:5000/${endpoint}, formData, {
        headers: {
            ...formData.getHeaders(),
        },
    });

    return response.data;
};

// Upload and clean CSV
app.post('/upload_csv', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'upload_csv');
        res.json({ message: "File uploaded and cleaned successfully", data: result });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error processing file' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Perform RFM analysis
app.post('/rfm_analysis', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'rfm_analysis');
        res.json({ segment_data: result.segment_data });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error performing RFM analysis' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Train model
app.post('/train_model', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'train_model');
        res.json({
            confusion_matrix: result.confusion_matrix,
            classification_report: result.classification_report,
        });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error training model' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get monthly revenue
app.post('/monthly_revenue', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'monthly_revenue');
        res.json({ monthly_revenue: result.monthly_revenue });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching monthly revenue' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get daily revenue
app.post('/daily_revenue', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'daily_revenue');
        res.json({ daily_revenue: result.daily_revenue });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching daily revenue' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get top customers
app.post('/top_customers', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'top_customers');
        res.json({ top_customers: result.top_customers });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching top customers' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get top products
app.post('/top_products', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'top_products');
        res.json({ top_products: result.top_products });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching top products' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get monthly customer acquisition
app.post('/monthly_customer_acquisition', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'monthly_customer_acquisition');
        res.json({ monthly_acquisition: result.monthly_acquisition });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching monthly customer acquisition' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get geographical analysis
app.post('/geographical_analysis', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'geographical_analysis');
        res.json({ geographical_revenue: result.geographical_revenue });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching geographical analysis' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get product return rate
app.post('/product_return_rate', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'product_return_rate');
        res.json({ product_return_rate: result.product_return_rate });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching product return rate' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Get customer activity heatmap
app.post('/customer_activity_heatmap', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'customer_activity_heatmap');
        res.json({ activity_heatmap: result.activity_heatmap });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error fetching customer activity heatmap' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
    }
});

// Start server
app.listen(5001, () => {
    console.log('Backend server running on port 5001');
});




// const express = require('express');
// const multer = require('multer');
// const axios = require('axios');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const FormData = require('form-data');

// const app = express();
// const upload = multer({ dest: 'uploads/' });

// // Enable CORS
// app.use(cors());

// // Helper function to send file to Flask backend
// const sendFileToFlask = async (filePath, originalname, mimetype, endpoint) => {
//     const formData = new FormData();
//     formData.append('file', fs.createReadStream(filePath), {
//         filename: originalname,
//         contentType: mimetype,
//     });

//     const response = await axios.post(http://localhost:5000/${endpoint}, formData, {
//         headers: {
//             ...formData.getHeaders(),
//         },
//     });

//     return response.data;
// };


// // Upload and clean CSV
// app.post('/upload_csv', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'upload_csv');
//         res.json({ message: "File uploaded and cleaned successfully", data: result });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error processing file' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Perform RFM analysis
// app.post('/rfm_analysis', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'rfm_analysis');
//         res.json({ segment_data: result.segment_data });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error performing RFM analysis' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Train model
// app.post('/train_model', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'train_model');
//         res.json({
//             confusion_matrix: result.confusion_matrix,
//             classification_report: result.classification_report,
//         });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error training model' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get monthly revenue
// app.post('/monthly_revenue', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'monthly_revenue');
//         res.json({ monthly_revenue: result.monthly_revenue });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching monthly revenue' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get daily revenue
// app.post('/daily_revenue', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'daily_revenue');
//         res.json({ daily_revenue: result.daily_revenue });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching daily revenue' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get top customers
// app.post('/top_customers', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'top_customers');
//         res.json({ top_customers: result.top_customers });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching top customers' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get top products
// app.post('/top_products', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'top_products');
//         res.json({ top_products: result.top_products });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching top products' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get monthly customer acquisition
// app.post('/monthly_customer_acquisition', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'monthly_customer_acquisition');
//         res.json({ monthly_acquisition: result.monthly_acquisition });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching monthly customer acquisition' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get geographical analysis
// app.post('/geographical_analysis', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'geographical_analysis');
//         res.json({ geographical_revenue: result.geographical_revenue });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching geographical analysis' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });


// // Get product return rate
// app.post('/product_return_rate', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'product_return_rate');
//         res.json({ product_return_rate: result.product_return_rate });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching product return rate' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Get customer activity heatmap
// app.post('/customer_activity_heatmap', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }

//     try {
//         const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'customer_activity_heatmap');
//         res.json({ activity_heatmap: result.activity_heatmap });
//     } catch (error) {
//         console.error("Backend error:", error);
//         res.status(500).json({ error: 'Error fetching customer activity heatmap' });
//     } finally {
//         fs.unlinkSync(req.file.path); // Clean up uploaded file
//     }
// });

// // Start server
// app.listen(5001, () => {
//     console.log('Backend server running on port 5001');
// });