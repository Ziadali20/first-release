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

app.post('/clean_csv', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log("File uploaded:", req.file);

    try {
        const filePath = req.file.path;
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        console.log("Sending file to ML API for cleaning...");

        const mlResponse = await axios.post('http://localhost:5000/clean_csv', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log("ML API Response received.");

        // Send the cleaned JSON data back to the client
        res.json({ cleaned_data: mlResponse.data.cleaned_data });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ error: 'Error processing file' });
    }
});

app.listen(5001, () => {
    console.log('Backend server running on port 5001');
});


console.log('small test')