from flask import Flask, request, jsonify
import pandas as pd
import os
import chardet
from datetime import datetime

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def detect_encoding(file_path, sample_size=100_000):
    """Detects file encoding using a sample."""
    with open(file_path, "rb") as f:
        raw_data = f.read(sample_size)
    result = chardet.detect(raw_data)
    encoding = result["encoding"] if result["encoding"] else "utf-8"

    if encoding.lower() in ["ascii", "unknown", None]:
        encoding = "latin1"

    return encoding

def calculate_rfm(df):
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
    df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
    df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
    df = df.dropna(subset=['Quantity', 'UnitPrice', 'InvoiceDate'])
    df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
    today_date = df['InvoiceDate'].max() + pd.Timedelta(days=1)
    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda date: (today_date - date.max()).days,
        'InvoiceNo': lambda num: num.nunique(),
        'TotalPrice': lambda price: price.sum()
    })
    rfm.columns = ['Recency', 'Frequency', 'Monetary']
    rfm = rfm[rfm['Monetary'] > 0]
    rfm['recency_score'] = pd.qcut(rfm['Recency'], 5, labels=[5, 4, 3, 2, 1])
    rfm['frequency_score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5])
    rfm['monetary_score'] = pd.qcut(rfm['Monetary'], 5, labels=[1, 2, 3, 4, 5])
    rfm['RFM_SCORE'] = rfm['recency_score'].astype(str) + rfm['frequency_score'].astype(str)
    seg_map = {
        r'[1-2][1-2]': 'hibernating',
        r'[1-2][3-4]': 'at_Risk',
        r'[1-2]5': 'cant_loose',
        r'3[1-2]': 'about_to_Sleep',
        r'3[3-4]': 'Need_Attention',
        r'4[1-2]': 'loyal',
        r'4[3-4]': 'promising',
        r'5[1-2]': 'champions',
        r'5[3-4]': 'Potential',
    }
    rfm['segment'] = rfm['recency_score'].astype(str) + rfm['frequency_score'].astype(str)
    rfm['segment'] = rfm['segment'].replace(seg_map, regex=True)
    return rfm

@app.route('/clean_csv', methods=['POST'])
def clean_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        encoding = detect_encoding(file_path)
        df = pd.read_csv(file_path, encoding=encoding, dtype=str)

        # Remove rows with null values
        df_cleaned = df.dropna()
        rfm_data = calculate_rfm(df_cleaned)
        rfm_json = rfm_data.to_dict(orient="index")
        cleaned_data = df_cleaned.to_dict(orient="records")

        return jsonify({
            "cleaned_data": cleaned_data,
            "rfm_data": rfm_json
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

