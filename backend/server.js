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

// Serve static visualization files (adjust path if needed)
app.use('/static/visualizations', express.static(path.join(__dirname, 'static/visualizations')));

// Helper function to send file to Flask backend
const sendFileToFlask = async (filePath, originalname, mimetype, endpoint) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
        filename: originalname,
        contentType: mimetype,
    });

    try {
        const response = await axios.post(`http://localhost:5000/${endpoint}`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 300000, // Increased timeout for heavy computations
        });
        return response.data;
    } catch (error) {
        console.error(`Error in ${endpoint}:`, error.response?.data?.error || error.message);
        throw new Error(error.response?.data?.error || `Error processing ${endpoint}`);
    }
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
    console.error(error.stack);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
};

// Upload and clean CSV
app.post('/upload_csv', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'upload_csv');
        res.json({ message: result.message || 'File uploaded and cleaned successfully' });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// RFM analysis
app.post('/rfm_analysis', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'rfm_analysis');
        res.json({ segment_data: result.segment_data });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Train model
app.post('/train_model', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'train_model');
        res.json({
            confusion_matrix: result.confusion_matrix,
            classification_report: result.classification_report,
            model_trained: result.model_trained
        });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Churn prediction
app.post('/churn_prediction', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'churn_prediction');
        res.json({
            confusion_matrix: result.confusion_matrix,
            classification_report: result.classification_report,
            churn_predictions: result.churn_predictions
        });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Repurchase prediction
app.post('/repurchase_prediction', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'repurchase_prediction');
        res.json({ repurchase_predictions: result.repurchase_predictions });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Customer Lifetime Value
app.post('/customer_lifetime_value', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'customer_lifetime_value');
        res.json({ clv: result.clv });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Product Affinity Analysis
app.post('/product_affinity', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'product_affinity');
        res.json({ affinity_rules: result.affinity_rules });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Sentiment Analysis
app.post('/sentiment_analysis', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'sentiment_analysis');
        res.json({ sentiment_summary: result.sentiment_summary });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Inventory Turnover
app.post('/inventory_turnover', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'inventory_turnover');
        res.json({ inventory_turnover: result.inventory_turnover });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Discount Impact Analysis
app.post('/discount_impact', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'discount_impact');
        res.json({ discount_impact: result.discount_impact });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Monthly revenue
app.post('/monthly_revenue', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'monthly_revenue');
        res.json({ monthly_revenue: result.monthly_revenue });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Daily revenue
app.post('/daily_revenue', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'daily_revenue');
        res.json({ daily_revenue: result.daily_revenue });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Top customers
app.post('/top_customers', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'top_customers');
        res.json({ top_customers: result.top_customers });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Top products
app.post('/top_products', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'top_products');
        res.json({ top_products: result.top_products });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Monthly customer acquisition
app.post('/monthly_customer_acquisition', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'monthly_customer_acquisition');
        res.json({ monthly_acquisition: result.monthly_acquisition });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Geographical analysis
app.post('/geographical_analysis', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'geographical_analysis');
        res.json({ geographical_revenue: result.geographical_revenue });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Product return rate
app.post('/product_return_rate', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'product_return_rate');
        res.json({ product_return_rate: result.product_return_rate });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Customer activity heatmap
app.post('/customer_activity_heatmap', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'customer_activity_heatmap');
        res.json({
            activity_heatmap: result.activity_heatmap,
            peak_hour: result.peak_hour,
            peak_day: result.peak_day,
            peak_day_name: result.peak_day_name,
            recommendation: result.recommendation
        });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Seasonality analysis
app.post('/seasonality_analysis', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'seasonality_analysis');
        res.json({ seasonal_revenue: result.seasonal_revenue });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Retention rate
app.post('/retention_rate', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'retention_rate');
        res.json({
            retention_data: result.retention_data,
            avg_retention: result.avg_retention,
            recommendation: result.recommendation
        });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Sales drop analysis
app.post('/sales_drop_analysis', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'sales_drop_analysis');
        res.json({ sales_drop_factors: result.sales_drop_factors });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Marketing recommendations
app.post('/marketing_recommendations', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await sendFileToFlask(req.file.path, req.file.originalname, req.file.mimetype, 'marketing_recommendations');
        res.json({ marketing_recommendations: result.marketing_recommendations });
    } catch (error) {
        next(error);
    } finally {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

// Use error handling middleware
app.use(errorHandler);

// Start server
app.listen(5001, () => {
    console.log('Backend server running on port 5001');
});