from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import chardet
import datetime as dt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "Uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def detect_encoding(file_path, sample_size=100_000):
    with open(file_path, "rb") as f:
        raw_data = f.read(sample_size)
    result = chardet.detect(raw_data)
    encoding = result["encoding"] if result["encoding"] else "utf-8"

    if encoding.lower() in ["ascii", "unknown", None]:
        encoding = "latin1"

    return encoding

def load_and_clean_file(request):
    if 'file' not in request.files:
        raise ValueError("No file uploaded")

    file = request.files['file']
    if file.filename == '':
        raise ValueError("No file selected")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    encoding = detect_encoding(file_path)
    df = pd.read_csv(file_path, encoding=encoding, dtype=str)
    df_cleaned = df.dropna()

    # Ensure required columns are present
    required_columns = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID']
    if not all(col in df_cleaned.columns for col in required_columns):
        raise ValueError("CSV file must contain the following columns: InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID")

    # Convert columns to appropriate types
    df_cleaned['Quantity'] = pd.to_numeric(df_cleaned['Quantity'], errors='coerce')
    df_cleaned['UnitPrice'] = pd.to_numeric(df_cleaned['UnitPrice'], errors='coerce')
    df_cleaned['InvoiceDate'] = pd.to_datetime(df_cleaned['InvoiceDate'], errors='coerce')
    df_cleaned = df_cleaned.dropna(subset=['Quantity', 'UnitPrice', 'InvoiceDate'])
    df_cleaned['TotalPrice'] = df_cleaned['Quantity'] * df_cleaned['UnitPrice']

    return df_cleaned

def perform_rfm_analysis(df):
    required_columns = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID']
    if not all(col in df.columns for col in required_columns):
        raise ValueError("CSV file must contain the following columns: InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID")

    df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
    df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
    df = df.dropna(subset=['Quantity', 'UnitPrice'])
    df.loc[:, 'InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
    df = df.dropna(subset=['InvoiceDate'])
    df.loc[:, 'TotalPrice'] = df['Quantity'] * df['UnitPrice']

    today_date = dt.datetime(2011, 12, 31)
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
        r'33': 'need_attention',
        r'[3-4][4-5]': 'loyal_customers',
        r'41': 'promising',
        r'51': 'new_customers',
        r'[4-5][2-3]': 'potential_loyalists',
        r'5[4-5]': 'champions'
    }
    rfm['Segment'] = rfm['RFM_SCORE'].replace(seg_map, regex=True)

    return rfm

def train_random_forest(rfm):
    rfm['Purchased_Again'] = np.random.choice([0, 1], size=len(rfm), p=[0.7, 0.3])
    X = rfm[['Recency', 'Frequency', 'Monetary']]
    y = rfm['Purchased_Again']
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    conf_matrix = confusion_matrix(y_test, y_pred)
    class_report = classification_report(y_test, y_pred, output_dict=True)
    return model, conf_matrix, class_report

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
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
        df_cleaned = df.dropna()
        return jsonify({"message": "File uploaded and cleaned successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rfm_analysis', methods=['POST'])
def rfm_analysis():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)

        # Add Purchased_Again column for demonstration
        rfm['Purchased_Again'] = np.random.choice([0, 1], size=len(rfm), p=[0.7, 0.3])

        # Group by segment and include Purchased_Again in the output
        segment_data = rfm.groupby('Segment').apply(lambda x: x.reset_index().to_dict(orient='records')).to_dict()
        return jsonify({"segment_data": segment_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/train_model', methods=['POST'])
def train_model():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)
        model, conf_matrix, class_report = train_random_forest(rfm)
        return jsonify({
            "confusion_matrix": conf_matrix.tolist(),
            "classification_report": class_report
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/monthly_revenue', methods=['POST'])
def monthly_revenue():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)

        # Ensure the required columns are present
        required_columns = ['InvoiceDate', 'Quantity', 'UnitPrice', 'CustomerID']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": "CSV file must contain the following columns: InvoiceDate, Quantity, UnitPrice, CustomerID"}), 400

        # Merge RFM Segment with original dataframe
        df = df.merge(rfm[['Segment']], left_on='CustomerID', right_index=True, how='left')

        # Calculate total price for each transaction
        df['TotalPrice'] = df['Quantity'] * df['UnitPrice']

        # Extract month and year from InvoiceDate
        df['YearMonth'] = df['InvoiceDate'].dt.to_period('M')

        # Calculate monthly revenue by Segment
        monthly_revenue = df.groupby(['YearMonth', 'Segment'])['TotalPrice'].sum().reset_index()
        monthly_revenue['YearMonth'] = monthly_revenue['YearMonth'].astype(str)

        return jsonify({"monthly_revenue": monthly_revenue.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/daily_revenue', methods=['POST'])
def daily_revenue():
    try:
        df = load_and_clean_file(request)

        # Ensure the required columns are present
        required_columns = ['InvoiceDate', 'Quantity', 'UnitPrice']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": "CSV file must contain the following columns: InvoiceDate, Quantity, UnitPrice"}), 400

        # Calculate total price for each transaction
        df['TotalPrice'] = df['Quantity'] * df['UnitPrice']

        # Extract year, month, and day from InvoiceDate
        df['YearMonth'] = df['InvoiceDate'].dt.to_period('M')
        df['Day'] = df['InvoiceDate'].dt.day

        # Calculate daily revenue for each month
        daily_revenue = df.groupby(['YearMonth', 'Day'])['TotalPrice'].sum().reset_index()
        daily_revenue['YearMonth'] = daily_revenue['YearMonth'].astype(str)

        # Format the result as a nested dictionary: { "Year-Month": { "Day": Revenue } }
        daily_revenue_dict = daily_revenue.groupby('YearMonth').apply(
            lambda x: x.set_index('Day')['TotalPrice'].to_dict()
        ).to_dict()

        return jsonify({"daily_revenue": daily_revenue_dict}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/top_customers', methods=['POST'])
def top_customers():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)

        # Merge RFM Segment with original dataframe
        df = df.merge(rfm[['Segment']], left_on='CustomerID', right_index=True, how='left')

        # Calculate top customers with Segment
        top_customers = df.groupby(['CustomerID', 'Segment'])['TotalPrice'].sum().nlargest(10).reset_index()
        return jsonify({"top_customers": top_customers.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/top_products', methods=['POST'])
def top_products():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)

        # Merge RFM Segment with original dataframe
        df = df.merge(rfm[['Segment']], left_on='CustomerID', right_index=True, how='left')

        # Calculate top products with Segment
        top_products = df.groupby(['Description', 'Segment'])['TotalPrice'].sum().nlargest(10).reset_index()
        return jsonify({"top_products": top_products.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/monthly_customer_acquisition', methods=['POST'])
def monthly_customer_acquisition():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)

        # Merge RFM Segment with original dataframe
        df = df.merge(rfm[['Segment']], left_on='CustomerID', right_index=True, how='left')

        # Calculate first purchase date by customer
        df['FirstPurchaseDate'] = df.groupby('CustomerID')['InvoiceDate'].transform('min')
        df['YearMonth'] = df['FirstPurchaseDate'].dt.to_period('M')

        # Calculate monthly acquisition by Segment
        monthly_acquisition = df.groupby(['YearMonth', 'Segment'])['CustomerID'].nunique().reset_index()
        monthly_acquisition['YearMonth'] = monthly_acquisition['YearMonth'].astype(str)
        
        # Rename the 'CustomerID' column to 'newCustomers'
        monthly_acquisition.rename(columns={'CustomerID': 'newCustomers'}, inplace=True)
        
        return jsonify({"monthly_acquisition": monthly_acquisition.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/geographical_analysis', methods=['POST'])
def geographical_analysis():
    try:
        df = load_and_clean_file(request)
        if 'Country' not in df.columns:
            raise ValueError("CSV file must contain a 'Country' column")
        geographical_revenue = df.groupby('Country')['TotalPrice'].sum().reset_index()
        return jsonify({"geographical_revenue": geographical_revenue.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/product_return_rate', methods=['POST'])
def product_return_rate():
    try:
        df = load_and_clean_file(request)
        returns = df[df['Quantity'] < 0]
        return_rate = returns.groupby('Description')['Quantity'].sum().reset_index()
        return_rate['ReturnRate'] = return_rate['Quantity'] / df.groupby('Description')['Quantity'].sum().abs()
        return_rate = return_rate.dropna()  # Drop rows with NaN values
        return jsonify({"product_return_rate": return_rate.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/customer_activity_heatmap', methods=['POST'])
def customer_activity_heatmap():
    try:
        df = load_and_clean_file(request)
        df['Hour'] = df['InvoiceDate'].dt.hour
        df['DayOfWeek'] = df['InvoiceDate'].dt.dayofweek
        activity_heatmap = df.groupby(['DayOfWeek', 'Hour'])['InvoiceNo'].nunique().reset_index()
        return jsonify({"activity_heatmap": activity_heatmap.to_dict(orient='records')}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)












# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import pandas as pd
# import numpy as np
# import os
# import chardet
# import datetime as dt
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.metrics import classification_report, confusion_matrix

# app = Flask(__name__)
# CORS(app)

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# def detect_encoding(file_path, sample_size=100_000):
#     with open(file_path, "rb") as f:
#         raw_data = f.read(sample_size)
#     result = chardet.detect(raw_data)
#     encoding = result["encoding"] if result["encoding"] else "utf-8"

#     if encoding.lower() in ["ascii", "unknown", None]:
#         encoding = "latin1"

#     return encoding

# def load_and_clean_file(request):
#     if 'file' not in request.files:
#         raise ValueError("No file uploaded")

#     file = request.files['file']
#     if file.filename == '':
#         raise ValueError("No file selected")

#     file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(file_path)

#     encoding = detect_encoding(file_path)
#     df = pd.read_csv(file_path, encoding=encoding, dtype=str)
#     df_cleaned = df.dropna()

#     # Ensure required columns are present
#     required_columns = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID']
#     if not all(col in df_cleaned.columns for col in required_columns):
#         raise ValueError("CSV file must contain the following columns: InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID")

#     # Convert columns to appropriate types
#     df_cleaned['Quantity'] = pd.to_numeric(df_cleaned['Quantity'], errors='coerce')
#     df_cleaned['UnitPrice'] = pd.to_numeric(df_cleaned['UnitPrice'], errors='coerce')
#     df_cleaned['InvoiceDate'] = pd.to_datetime(df_cleaned['InvoiceDate'], errors='coerce')
#     df_cleaned = df_cleaned.dropna(subset=['Quantity', 'UnitPrice', 'InvoiceDate'])
#     df_cleaned['TotalPrice'] = df_cleaned['Quantity'] * df_cleaned['UnitPrice']

#     return df_cleaned

# def perform_rfm_analysis(df):
#     required_columns = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID']
#     if not all(col in df.columns for col in required_columns):
#         raise ValueError("CSV file must contain the following columns: InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID")

#     df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
#     df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
#     df = df.dropna(subset=['Quantity', 'UnitPrice'])
#     df.loc[:, 'InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
#     df = df.dropna(subset=['InvoiceDate'])
#     df.loc[:, 'TotalPrice'] = df['Quantity'] * df['UnitPrice']

#     today_date = dt.datetime(2011, 12, 31)
#     rfm = df.groupby('CustomerID').agg({
#         'InvoiceDate': lambda date: (today_date - date.max()).days,
#         'InvoiceNo': lambda num: num.nunique(),
#         'TotalPrice': lambda price: price.sum()
#     })

#     rfm.columns = ['Recency', 'Frequency', 'Monetary']
#     rfm = rfm[rfm['Monetary'] > 0]

#     rfm['recency_score'] = pd.qcut(rfm['Recency'], 5, labels=[5, 4, 3, 2, 1])
#     rfm['frequency_score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5])
#     rfm['monetary_score'] = pd.qcut(rfm['Monetary'], 5, labels=[1, 2, 3, 4, 5])
#     rfm['RFM_SCORE'] = rfm['recency_score'].astype(str) + rfm['frequency_score'].astype(str)

#     seg_map = {
#         r'[1-2][1-2]': 'hibernating',
#         r'[1-2][3-4]': 'at_Risk',
#         r'[1-2]5': 'cant_loose',
#         r'3[1-2]': 'about_to_Sleep',
#         r'33': 'need_attention',
#         r'[3-4][4-5]': 'loyal_customers',
#         r'41': 'promising',
#         r'51': 'new_customers',
#         r'[4-5][2-3]': 'potential_loyalists',
#         r'5[4-5]': 'champions'
#     }
#     rfm['segment'] = rfm['RFM_SCORE'].replace(seg_map, regex=True)

#     return rfm

# def train_random_forest(rfm):
#     rfm['Purchased_Again'] = np.random.choice([0, 1], size=len(rfm), p=[0.7, 0.3])
#     X = rfm[['Recency', 'Frequency', 'Monetary']]
#     y = rfm['Purchased_Again']
#     scaler = StandardScaler()
#     X_scaled = scaler.fit_transform(X)
#     X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
#     model = RandomForestClassifier(random_state=42)
#     model.fit(X_train, y_train)
#     y_pred = model.predict(X_test)
#     conf_matrix = confusion_matrix(y_test, y_pred)
#     class_report = classification_report(y_test, y_pred, output_dict=True)
#     return model, conf_matrix, class_report

# @app.route('/upload_csv', methods=['POST'])
# def upload_csv():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"error": "No file selected"}), 400

#     file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(file_path)

#     try:
#         encoding = detect_encoding(file_path)
#         df = pd.read_csv(file_path, encoding=encoding, dtype=str)
#         df_cleaned = df.dropna()
#         return jsonify({"message": "File uploaded and cleaned successfully"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/rfm_analysis', methods=['POST'])
# def rfm_analysis():
#     try:
#         df = load_and_clean_file(request)
#         rfm = perform_rfm_analysis(df)

#         # Add Purchased_Again column for demonstration
#         rfm['Purchased_Again'] = np.random.choice([0, 1], size=len(rfm), p=[0.7, 0.3])

#         # Group by segment and include Purchased_Again in the output
#         segment_data = rfm.groupby('segment').apply(lambda x: x.reset_index().to_dict(orient='records')).to_dict()
#         return jsonify({"segment_data": segment_data}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/train_model', methods=['POST'])
# def train_model():
#     try:
#         df = load_and_clean_file(request)
#         rfm = perform_rfm_analysis(df)
#         model, conf_matrix, class_report = train_random_forest(rfm)
#         return jsonify({
#             "confusion_matrix": conf_matrix.tolist(),
#             "classification_report": class_report
#         }), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/monthly_revenue', methods=['POST'])
# def monthly_revenue():
#     try:
#         df = load_and_clean_file(request)

#         # Ensure the required columns are present
#         required_columns = ['InvoiceDate', 'Quantity', 'UnitPrice']
#         if not all(col in df.columns for col in required_columns):
#             return jsonify({"error": "CSV file must contain the following columns: InvoiceDate, Quantity, UnitPrice"}), 400

#         # Convert columns to appropriate types
#         df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
#         df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
#         df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
#         df = df.dropna(subset=['Quantity', 'UnitPrice', 'InvoiceDate'])

#         # Calculate total price for each transaction
#         df['TotalPrice'] = df['Quantity'] * df['UnitPrice']

#         # Extract month and year from InvoiceDate
#         df['YearMonth'] = df['InvoiceDate'].dt.to_period('M')

#         # Calculate monthly revenue
#         monthly_revenue = df.groupby('YearMonth')['TotalPrice'].sum().reset_index()
#         monthly_revenue['YearMonth'] = monthly_revenue['YearMonth'].astype(str)

#         return jsonify({"monthly_revenue": monthly_revenue.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/daily_revenue', methods=['POST'])
# def daily_revenue():
#     try:
#         df = load_and_clean_file(request)

#         # Ensure the required columns are present
#         required_columns = ['InvoiceDate', 'Quantity', 'UnitPrice']
#         if not all(col in df.columns for col in required_columns):
#             return jsonify({"error": "CSV file must contain the following columns: InvoiceDate, Quantity, UnitPrice"}), 400

#         # Convert columns to appropriate types
#         df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
#         df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
#         df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
#         df = df.dropna(subset=['Quantity', 'UnitPrice', 'InvoiceDate'])

#         # Calculate total price for each transaction
#         df['TotalPrice'] = df['Quantity'] * df['UnitPrice']

#         # Extract year, month, and day from InvoiceDate
#         df['YearMonth'] = df['InvoiceDate'].dt.to_period('M')
#         df['Day'] = df['InvoiceDate'].dt.day

#         # Calculate daily revenue for each month
#         daily_revenue = df.groupby(['YearMonth', 'Day'])['TotalPrice'].sum().reset_index()
#         daily_revenue['YearMonth'] = daily_revenue['YearMonth'].astype(str)

#         # Format the result as a nested dictionary: { "Year-Month": { "Day": Revenue } }
#         daily_revenue_dict = daily_revenue.groupby('YearMonth').apply(
#             lambda x: x.set_index('Day')['TotalPrice'].to_dict()
#         ).to_dict()

#         return jsonify({"daily_revenue": daily_revenue_dict}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/top_customers', methods=['POST'])
# def top_customers():
#     try:
#         df = load_and_clean_file(request)
#         top_customers = df.groupby('CustomerID')['TotalPrice'].sum().nlargest(10).reset_index()
#         return jsonify({"top_customers": top_customers.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/top_products', methods=['POST'])
# def top_products():
#     try:
#         df = load_and_clean_file(request)
#         top_products = df.groupby('Description')['TotalPrice'].sum().nlargest(10).reset_index()
#         return jsonify({"top_products": top_products.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/monthly_customer_acquisition', methods=['POST'])
# def monthly_customer_acquisition():
#     try:
#         df = load_and_clean_file(request)
#         df['FirstPurchaseDate'] = df.groupby('CustomerID')['InvoiceDate'].transform('min')
#         df['YearMonth'] = df['FirstPurchaseDate'].dt.to_period('M')
#         monthly_acquisition = df.groupby('YearMonth')['CustomerID'].nunique().reset_index()
#         monthly_acquisition['YearMonth'] = monthly_acquisition['YearMonth'].astype(str)
        
#         # Rename the 'CustomerID' column to 'newCustomers'
#         monthly_acquisition.rename(columns={'CustomerID': 'newCustomers'}, inplace=True)
        
#         return jsonify({"monthly_acquisition": monthly_acquisition.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
# @app.route('/geographical_analysis', methods=['POST'])
# def geographical_analysis():
#     try:
#         df = load_and_clean_file(request)
#         if 'Country' not in df.columns:
#             raise ValueError("CSV file must contain a 'Country' column")
#         geographical_revenue = df.groupby('Country')['TotalPrice'].sum().reset_index()
#         return jsonify({"geographical_revenue": geographical_revenue.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @app.route('/product_return_rate', methods=['POST'])
# def product_return_rate():
#     try:
#         df = load_and_clean_file(request)
#         returns = df[df['Quantity'] < 0]
#         return_rate = returns.groupby('Description')['Quantity'].sum().reset_index()
#         return_rate['ReturnRate'] = return_rate['Quantity'] / df.groupby('Description')['Quantity'].sum().abs()
#         return jsonify({"product_return_rate": return_rate.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/customer_activity_heatmap', methods=['POST'])
# def customer_activity_heatmap():
#     try:
#         df = load_and_clean_file(request)
#         df['Hour'] = df['InvoiceDate'].dt.hour
#         df['DayOfWeek'] = df['InvoiceDate'].dt.dayofweek
#         activity_heatmap = df.groupby(['DayOfWeek', 'Hour'])['InvoiceNo'].nunique().reset_index()
#         return jsonify({"activity_heatmap": activity_heatmap.to_dict(orient='records')}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
