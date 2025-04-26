import logging
import os
import numpy as np
import pandas as pd
import chardet
import csv
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from mlxtend.frequent_patterns import apriori, association_rules
from textblob import TextBlob
import warnings
import psutil

# Suppress warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=pd.errors.SettingWithCopyWarning)

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = "Uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def detect_encoding(file_path, sample_size=100_000):
    try:
        with open(file_path, "rb") as f:
            raw_data = f.read(sample_size)
        result = chardet.detect(raw_data)
        encoding = result["encoding"] if result["encoding"] else "utf-8"
        if encoding.lower() in ["ascii", "unknown", None]:
            encoding = "latin1"
        return encoding
    except Exception as e:
        logger.error(f"Error detecting encoding: {e}")
        raise ValueError("Failed to detect file encoding")

def load_and_clean_file(request):
    try:
        if 'file' not in request.files:
            raise ValueError("No file uploaded")
        
        file = request.files['file']
        if file.filename == '':
            raise ValueError("No file selected")
        
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        encoding = detect_encoding(file_path)
        
        # Modified to handle your specific dataset format
        try:
            df = pd.read_csv(
                file_path,
                encoding=encoding,
                dtype={
                    'Customer Name': str,
                    'InvoiceNo': str,
                    'StockCode': str,
                    'Description': str,
                    'Quantity': float,
                    'UnitPrice': float,
                    'CustomerID': str,
                    'Country': str,
                    'Email': str,
                    'Customer': str
                },
                parse_dates=['InvoiceDate'],
                on_bad_lines='skip'
            )
        except Exception as e:
            logger.error(f"CSV parsing failed with standard format: {e}")
            try:
                df = pd.read_csv(
                    file_path,
                    encoding=encoding,
                    dtype={
                        'Customer Name': str,
                        'InvoiceNo': str,
                        'StockCode': str,
                        'Description': str,
                        'Quantity': str,
                        'UnitPrice': str,
                        'CustomerID': str,
                        'Country': str,
                        'Email': str,
                        'Customer': str
                    },
                    on_bad_lines='skip'
                )
                df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
                df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
                df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
            except Exception as e2:
                raise ValueError(f"Failed to parse CSV: {str(e)} then {str(e2)}")
        
        logger.info(f"Original columns: {df.columns.tolist()}")
        logger.info(f"First 5 rows:\n{df.head().to_string()}")
        logger.info(f"Initial data types:\n{df.dtypes}")
        
        required_columns = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice']
        required_id_columns = ['CustomerID', 'Customer Name']
        
        has_customer_id = any(col in df.columns for col in required_id_columns)
        if not has_customer_id:
            raise ValueError(f"CSV file must contain at least one customer identifier column: {', '.join(required_id_columns)}")
        
        if not all(col in df.columns for col in required_columns):
            missing_cols = [col for col in required_columns if col not in df.columns]
            raise ValueError(f"CSV file missing columns: {', '.join(missing_cols)}")
        
        if 'CustomerID' not in df.columns and 'Customer Name' in df.columns:
            df['CustomerID'] = df['Customer Name']
            logger.info("Using 'Customer Name' as 'CustomerID'")
        
        df['CustomerID'] = df['CustomerID'].astype(str)
        
        if 'Country' not in df.columns:
            df['Country'] = 'Unknown'
            logger.info("Added default 'Country' column")
        
        df = df.dropna(subset=['InvoiceNo', 'Quantity', 'UnitPrice', 'InvoiceDate'])
        
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        invalid_dates = df['InvoiceDate'].isna().sum()
        if invalid_dates > 0:
            logger.warning(f"Dropping {invalid_dates} rows with invalid InvoiceDate")
            df = df.dropna(subset=['InvoiceDate'])
        
        for col in ['Quantity', 'UnitPrice']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            invalid_nums = df[col].isna().sum()
            if invalid_nums > 0:
                logger.warning(f"Dropping {invalid_nums} rows with invalid {col}")
                df = df.dropna(subset=[col])
        
        df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
        
        if df.empty:
            raise ValueError("No valid data after cleaning")
        
        logger.info(f"Final data types:\n{df.dtypes}")
        logger.info(f"Final columns: {df.columns.tolist()}")
        
        return df
    except Exception as e:
        logger.error(f"Error in load_and_clean_file: {e}")
        raise

def perform_rfm_analysis(df):
    try:
        required_columns = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"CSV file must contain the following columns: {', '.join(required_columns)}")
        
        df_cleaned = df.copy()
        
        today_date = pd.to_datetime(df_cleaned['InvoiceDate'].max()) + pd.Timedelta(days=1)
        rfm = df_cleaned.groupby('CustomerID').agg({
            'InvoiceDate': lambda date: (today_date - pd.to_datetime(date.max())).days,
            'InvoiceNo': lambda num: num.nunique(),
            'TotalPrice': lambda price: price.sum()
        })
        
        rfm.columns = ['Recency', 'Frequency', 'Monetary']
        rfm = rfm[rfm['Monetary'] > 0]
        
        rfm['recency_score'] = pd.qcut(rfm['Recency'], 5, labels=[5, 4, 3, 2, 1], duplicates='drop')
        rfm['frequency_score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5], duplicates='drop')
        rfm['monetary_score'] = pd.qcut(rfm['Monetary'], 5, labels=[1, 2, 3, 4, 5], duplicates='drop')
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
        rfm['segment'] = rfm['RFM_SCORE'].replace(seg_map, regex=True)
        
        rfm['recommendation'] = rfm['segment'].map({
            'hibernating': 'Send re-engagement email with discount.',
            'at_Risk': 'Offer loyalty discount to retain.',
            'cant_loose': 'Provide exclusive offer to prevent churn.',
            'about_to_Sleep': 'Send reminder email with new products.',
            'need_attention': 'Engage with personalized recommendations.',
            'loyal_customers': 'Reward with loyalty points.',
            'promising': 'Upsell with product bundles.',
            'new_customers': 'Welcome email with first-purchase discount.',
            'potential_loyalists': 'Encourage repeat purchase with coupon.',
            'champions': 'VIP program invitation.'
        })
        
        return rfm
    except Exception as e:
        logger.error(f"Error in perform_rfm_analysis: {e}")
        raise

def train_random_forest(rfm, df):
    try:
        max_date = pd.to_datetime(df['InvoiceDate'].max())
        cutoff_date = max_date - pd.Timedelta(days=90)
        future_purchases = df[pd.to_datetime(df['InvoiceDate']) > cutoff_date].groupby('CustomerID')['InvoiceNo'].nunique()
        rfm['Purchased_Again'] = rfm.index.isin(future_purchases.index).astype(int)
        
        if rfm['Purchased_Again'].sum() == 0:
            logger.warning("No future purchases found for training. Using synthetic labels.")
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
        return model, scaler, conf_matrix, class_report
    except Exception as e:
        logger.error(f"Error in train_random_forest: {e}")
        raise

def train_churn_model(rfm, df):
    try:
        last_purchase = df.groupby('CustomerID')['InvoiceDate'].max()
        today_date = pd.to_datetime(df['InvoiceDate'].max()) + pd.Timedelta(days=1)
        rfm['Days_Since_Last_Purchase'] = rfm.index.map(lambda x: (today_date - pd.to_datetime(last_purchase[x])).days)
        rfm['Churn'] = (rfm['Days_Since_Last_Purchase'] > 90).astype(int)
        
        X = rfm[['Recency', 'Frequency', 'Monetary', 'Days_Since_Last_Purchase']]
        y = rfm['Churn']
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        model = RandomForestClassifier(random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        conf_matrix = confusion_matrix(y_test, y_pred)
        class_report = classification_report(y_test, y_pred, output_dict=True)
        return model, scaler, conf_matrix, class_report
    except Exception as e:
        logger.error(f"Error in train_churn_model: {e}")
        raise

def calculate_clv(df):
    try:
        avg_purchase_value = df.groupby('CustomerID')['TotalPrice'].mean()
        purchase_frequency = df.groupby('CustomerID')['InvoiceNo'].nunique() / df['InvoiceDate'].dt.year.nunique()
        retention_rate = df.groupby('CustomerID')['InvoiceNo'].count().apply(lambda x: min(x / 10, 0.9))
        churn_rate = 1 - retention_rate
        clv = (avg_purchase_value * purchase_frequency * retention_rate) / churn_rate
        clv = clv.reset_index().rename(columns={0: 'CLV'})
        
        clv['recommendation'] = clv['CLV'].apply(
            lambda x: 'Focus on retention with loyalty program.' if x > clv['CLV'].quantile(0.75)
            else 'Engage with targeted promotions.' if x > clv['CLV'].quantile(0.25)
            else 'Low CLV; minimize marketing spend.'
        )
        
        return clv
    except Exception as e:
        logger.error(f"Error in calculate_clv: {e}")
        raise

def product_affinity_analysis(df):
    try:
        memory = psutil.virtual_memory()
        logger.info(f"Available memory: {memory.available / (1024**2):.2f} MiB")
        
        df_sample = df.sample(frac=0.005, random_state=42)
        item_counts = df_sample['Description'].value_counts()
        frequent_items = item_counts[item_counts > 5].index
        df_sample = df_sample[df_sample['Description'].isin(frequent_items)]
        
        logger.info(f"Sample size: {len(df_sample)}, Unique items: {len(frequent_items)}")
        
        basket = df_sample.groupby(['InvoiceNo', 'Description'])['Quantity'].sum().unstack(fill_value=0)
        basket = (basket > 0).astype(pd.SparseDtype(bool, fill_value=False))
        
        frequent_itemsets = apriori(basket, min_support=0.005, use_colnames=True, low_memory=True)
        if frequent_itemsets.empty:
            logger.warning("No frequent itemsets found.")
            return []
        
        rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1)
        if rules.empty:
            logger.warning("No association rules found.")
            return []
        
        rules = rules.sort_values('lift', ascending=False).head(10)
        
        # Fix: Convert frozenset to string for JSON serialization
        rules['antecedents'] = rules['antecedents'].apply(lambda x: ', '.join(x))
        rules['consequents'] = rules['consequents'].apply(lambda x: ', '.join(x))
        
        # Update recommendation to use stringified antecedents/consequents
        rules['recommendation'] = rules.apply(
            lambda x: f"Bundle {x['antecedents']} with {x['consequents']} (Confidence: {x['confidence']:.2f}, Lift: {x['lift']:.2f})",
            axis=1
        )
        
        logger.info(f"Rules after conversion:\n{rules[['antecedents', 'consequents', 'recommendation']].head().to_string()}")
        
        return rules[['antecedents', 'consequents', 'support', 'confidence', 'lift', 'recommendation']].to_dict(orient='records')
    except Exception as e:
        logger.error(f"Error in product_affinity_analysis: {e}")
        raise

def sentiment_analysis(df):
    try:
        df['Sentiment'] = df['Description'].apply(lambda x: TextBlob(str(x)).sentiment.polarity)
        sentiment_summary = df.groupby('Description')['Sentiment'].mean().reset_index()
        
        sentiment_summary['recommendation'] = sentiment_summary['Sentiment'].apply(
            lambda x: 'Highlight in marketing.' if x > 0.2
            else 'Review description for negative tone.' if x < -0.2
            else 'Neutral; monitor customer feedback.'
        )
        
        return sentiment_summary.to_dict(orient='records')
    except Exception as e:
        logger.error(f"Error in sentiment_analysis: {e}")
        raise

def inventory_turnover(df):
    try:
        total_quantity_sold = df[df['Quantity'] > 0].groupby('Description')['Quantity'].sum()
        avg_inventory = df.groupby('Description')['Quantity'].apply(lambda x: x.abs().mean())
        
        if total_quantity_sold.empty or avg_inventory.empty:
            logger.warning("Insufficient data for inventory turnover calculation.")
            return []
        
        common_index = total_quantity_sold.index.intersection(avg_inventory.index)
        if not common_index.empty:
            total_quantity_sold = total_quantity_sold.loc[common_index]
            avg_inventory = avg_inventory.loc[common_index]
        else:
            logger.warning("No common items for turnover calculation.")
            return []
        
        turnover = (total_quantity_sold / avg_inventory).rename('Turnover_Rate')
        turnover = turnover.reset_index()
        
        turnover['recommendation'] = turnover['Turnover_Rate'].apply(
            lambda x: 'Increase stock due to high demand.' if x > turnover['Turnover_Rate'].quantile(0.75)
            else 'Reduce stock to avoid overstocking.' if x < turnover['Turnover_Rate'].quantile(0.25)
            else 'Maintain current stock levels.'
        )
        
        return turnover.to_dict(orient='records')
    except Exception as e:
        logger.error(f"Error in inventory_turnover: {e}")
        raise

def discount_impact_analysis(df):
    try:
        discount_levels = [0, 0.05, 0.1, 0.15, 0.2]
        df['Simulated_Discount'] = np.random.choice(discount_levels, size=len(df), p=[0.5, 0.2, 0.15, 0.1, 0.05])
        df['Discounted_Price'] = df['UnitPrice'] * (1 - df['Simulated_Discount'])
        df['Discounted_TotalPrice'] = df['Quantity'] * df['Discounted_Price']
        discount_impact = df.groupby('Simulated_Discount')['Discounted_TotalPrice'].sum().reset_index()
        
        discount_impact['recommendation'] = discount_impact.apply(
            lambda x: f"Discount of {x['Simulated_Discount']*100:.0f}% yields {x['Discounted_TotalPrice']:.2f}; evaluate demand elasticity.",
            axis=1
        )
        
        return discount_impact.to_dict(orient='records')
    except Exception as e:
        logger.error(f"Error in discount_impact_analysis: {e}")
        raise

def sales_drop_analysis(df):
    try:
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        df = df.dropna(subset=['InvoiceDate'])
        
        df['YearMonth'] = df['InvoiceDate'].dt.strftime('%Y-%m')
        
        monthly_revenue = df.groupby('YearMonth')['TotalPrice'].sum().reset_index()
        
        monthly_revenue['YearMonth_date'] = pd.to_datetime(monthly_revenue['YearMonth'] + '-01')
        monthly_revenue = monthly_revenue.sort_values('YearMonth_date')
        
        if len(monthly_revenue) >= 13:
            monthly_revenue['YoY_Change'] = monthly_revenue['TotalPrice'].pct_change(12).fillna(0)
        else:
            monthly_revenue['YoY_Change'] = monthly_revenue['TotalPrice'].pct_change().fillna(0)
            logger.warning("Insufficient data for YoY calculation, using MoM instead")
        
        drops = monthly_revenue[monthly_revenue['YoY_Change'] < -0.1].copy()
        if drops.empty:
            logger.info("No significant sales drops detected.")
            return []
        
        factors = []
        for _, row in drops.iterrows():
            current_month = row['YearMonth']
            month_data = df[df['YearMonth'] == current_month].copy()
            
            customer_count = month_data['CustomerID'].nunique()
            avg_order_value = month_data.groupby('InvoiceNo')['TotalPrice'].sum().mean()
            total_orders = month_data['InvoiceNo'].nunique()
            
            sales_qty = df[(df['YearMonth'] == current_month) & (df['Quantity'] > 0)]['Quantity'].sum()
            returns_qty = df[(df['YearMonth'] == current_month) & (df['Quantity'] < 0)]['Quantity'].abs().sum()
            
            return_rate = 0
            if sales_qty > 0:
                return_rate = returns_qty / sales_qty
            
            overall_customer_avg = df.groupby('YearMonth')['CustomerID'].nunique().mean()
            overall_order_avg = df.groupby(['YearMonth', 'InvoiceNo'])['TotalPrice'].sum().groupby('YearMonth').mean().mean()
            
            reasons = []
            recommendations = []
            
            if customer_count < overall_customer_avg * 0.8:
                reasons.append(f"Customer activity dropped to {customer_count} customers vs. avg {overall_customer_avg:.0f}")
                recommendations.append("Launch customer re-engagement campaign with special offers")
            
            if avg_order_value < overall_order_avg * 0.8:
                reasons.append(f"Low average order value: ${avg_order_value:.2f} vs. avg ${overall_order_avg:.2f}")
                recommendations.append("Implement product bundling and upselling strategies")
            
            if return_rate > 0.05:
                reasons.append(f"High return rate: {return_rate:.1%}")
                recommendations.append("Review product quality and listings for accuracy")
            
            if not reasons:
                reasons.append("No clear single factor identified")
                recommendations.append("Investigate external factors like seasonality or competition")
            
            factors.append({
                'YearMonth': current_month,
                'Revenue': float(row['TotalPrice']),
                'YoY_Change': float(row['YoY_Change']),
                'CustomerCount': int(customer_count),
                'AvgOrderValue': float(avg_order_value),
                'ReturnRate': float(return_rate),
                'Reasons': reasons,
                'Recommendations': recommendations
            })
        
        return factors
    except Exception as e:
        logger.error(f"Error in sales_drop_analysis: {e}")
        raise

def marketing_recommendations(rfm, rules):
    try:
        if rfm is None or rfm.empty:
            return [{"Segment": "No data", "Recommendation": "Insufficient data for recommendations"}]
            
        if not isinstance(rules, list):
            rules = []
        
        recommendations = []
        
        for segment in rfm['segment'].unique():
            segment_customers = rfm[rfm['segment'] == segment]
            
            top_customers = []
            try:
                if 'Monetary' in segment_customers.columns:
                    top_customers = segment_customers.nlargest(5, 'Monetary').index.tolist()
                top_customers = [str(c) for c in top_customers]
            except Exception as e:
                logger.warning(f"Error getting top customers: {e}")
            
            bundle_suggestions = []
            for i, rule in enumerate(rules[:3]):
                try:
                    if isinstance(rule, dict) and 'antecedents' in rule and 'consequents' in rule and 'lift' in rule:
                        bundle_suggestions.append(
                            f"Bundle {rule['antecedents']} with {rule['consequents']} (Lift: {float(rule['lift']):.2f})"
                        )
                except Exception as e:
                    logger.warning(f"Error processing rule {i}: {e}")
            
            segment_recommendation = "General marketing recommendation"
            if 'recommendation' in segment_customers.columns and not segment_customers.empty:
                segment_recommendation = segment_customers['recommendation'].iloc[0]
            
            recommendations.append({
                'Segment': str(segment),
                'CustomerCount': int(len(segment_customers)),
                'TopCustomers': top_customers,
                'Recommendation': str(segment_recommendation),
                'ProductBundles': bundle_suggestions if bundle_suggestions else ["No specific bundle recommendations identified"]
            })
        
        return recommendations
    except Exception as e:
        logger.error(f"Error in marketing_recommendations: {e}")
        return [{"Segment": "Error", "Recommendation": f"Error generating recommendations: {str(e)}"}]

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    try:
        df = load_and_clean_file(request)
        return jsonify({"message": "File uploaded and cleaned successfully"}), 200
    except Exception as e:
        logger.error(f"Error in upload_csv: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/rfm_analysis', methods=['POST'])
def rfm_analysis():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)
        segment_data = rfm.groupby('segment').apply(lambda x: x.reset_index().to_dict(orient='records')).to_dict()
        return jsonify({"segment_data": segment_data}), 200
    except Exception as e:
        logger.error(f"Error in rfm_analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/train_model', methods=['POST'])
def train_model():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)
        model, scaler, conf_matrix, class_report = train_random_forest(rfm, df)
        return jsonify({
            "confusion_matrix": conf_matrix.tolist(),
            "classification_report": class_report,
            "model_trained": True
        }), 200
    except Exception as e:
        logger.error(f"Error in train_model: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/churn_prediction', methods=['POST'])
def churn_prediction():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)
        model, scaler, conf_matrix, class_report = train_churn_model(rfm, df)
        churn_probs = model.predict_proba(scaler.transform(rfm[['Recency', 'Frequency', 'Monetary', 'Days_Since_Last_Purchase']]))[:, 1]
        rfm_reset = rfm.reset_index()
        rfm_reset['Churn_Probability'] = churn_probs
        rfm_reset['recommendation'] = rfm_reset['Churn_Probability'].apply(
            lambda x: f"High churn risk ({x:.2f}); offer discount." if x > 0.7
            else f"Moderate risk ({x:.2f}); engage with email." if x > 0.3
            else f"Low risk ({x:.2f}); maintain relationship."
        )
        return jsonify({
            "confusion_matrix": conf_matrix.tolist(),
            "classification_report": class_report,
            "churn_predictions": rfm_reset[['CustomerID', 'Churn_Probability', 'recommendation']].to_dict(orient='records')
        }), 200
    except Exception as e:
        logger.error(f"Error in churn_prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/repurchase_prediction', methods=['POST'])
def repurchase_prediction():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)
        model, scaler, _, _ = train_random_forest(rfm, df)
        repurchase_probs = model.predict_proba(scaler.transform(rfm[['Recency', 'Frequency', 'Monetary']]))[:, 1]
        rfm_reset = rfm.reset_index()
        rfm_reset['Repurchase_Probability'] = repurchase_probs
        rfm_reset['recommendation'] = rfm_reset['Repurchase_Probability'].apply(
            lambda x: f"High repurchase likelihood ({x:.2f}); upsell products." if x > 0.7
            else f"Moderate likelihood ({x:.2f}); send promotional email." if x > 0.3
            else f"Low likelihood ({x:.2f}); re-engage with discount."
        )
        return jsonify({
            "repurchase_predictions": rfm_reset[['CustomerID', 'Repurchase_Probability', 'recommendation']].to_dict(orient='records')
        }), 200
    except Exception as e:
        logger.error(f"Error in repurchase_prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/customer_lifetime_value', methods=['POST'])
def customer_lifetime_value():
    try:
        df = load_and_clean_file(request)
        clv = calculate_clv(df)
        return jsonify({"clv": clv.to_dict(orient='records')}), 200
    except Exception as e:
        logger.error(f"Error in customer_lifetime_value: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/product_affinity', methods=['POST'])
def product_affinity():
    try:
        df = load_and_clean_file(request)
        rules = product_affinity_analysis(df)
        return jsonify({"affinity_rules": rules}), 200
    except Exception as e:
        logger.error(f"Error in product_affinity: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/sentiment_analysis', methods=['POST'])
def sentiment_analysis_endpoint():
    try:
        df = load_and_clean_file(request)
        sentiment_summary = sentiment_analysis(df)
        return jsonify({"sentiment_summary": sentiment_summary}), 200
    except Exception as e:
        logger.error(f"Error in sentiment_analysis_endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/inventory_turnover', methods=['POST'])
def inventory_turnover_endpoint():
    try:
        df = load_and_clean_file(request)
        turnover = inventory_turnover(df)
        return jsonify({"inventory_turnover": turnover}), 200
    except Exception as e:
        logger.error(f"Error in inventory_turnover_endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/discount_impact', methods=['POST'])
def discount_impact():
    try:
        df = load_and_clean_file(request)
        discount_impact = discount_impact_analysis(df)
        return jsonify({"discount_impact": discount_impact}), 200
    except Exception as e:
        logger.error(f"Error in discount_impact: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/monthly_revenue', methods=['POST'])
def monthly_revenue():
    try:
        df = load_and_clean_file(request)
        required_columns = ['InvoiceDate', 'Quantity', 'UnitPrice']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": f"CSV file must contain the following columns: {', '.join(required_columns)}"}), 400
        
        df['YearMonth'] = pd.to_datetime(df['InvoiceDate']).dt.to_period('M')
        monthly_revenue = df.groupby('YearMonth')['TotalPrice'].sum().reset_index()
        monthly_revenue['YoY_Change'] = monthly_revenue['TotalPrice'].pct_change(periods=12).fillna(0)
        monthly_revenue['recommendation'] = monthly_revenue['YoY_Change'].apply(
            lambda x: 'Investigate decline; consider promotions.' if x < -0.1
            else 'Monitor growth; optimize marketing.' if x > 0.1
            else 'Stable; maintain strategy.'
        )
        monthly_revenue['YearMonth'] = monthly_revenue['YearMonth'].astype(str)
        
        return jsonify({
            "monthly_revenue": monthly_revenue.to_dict(orient='records')
        }), 200
    except Exception as e:
        logger.error(f"Error in monthly_revenue: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/daily_revenue', methods=['POST'])
def daily_revenue():
    try:
        df = load_and_clean_file(request)
        required_columns = ['InvoiceDate', 'Quantity', 'UnitPrice']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": f"CSV file must contain the following columns: {', '.join(required_columns)}"}), 400
        
        df['YearMonth'] = pd.to_datetime(df['InvoiceDate']).dt.to_period('M')
        df['Day'] = df['InvoiceDate'].dt.day.astype(int)
        daily_revenue = df.groupby(['YearMonth', 'Day'])['TotalPrice'].sum().reset_index()
        daily_revenue['YearMonth'] = daily_revenue['YearMonth'].astype(str)
        
        daily_revenue_dict = daily_revenue.groupby('YearMonth').apply(
            lambda x: x.set_index('Day')['TotalPrice'].to_dict()
        ).to_dict()
        
        return jsonify({"daily_revenue": daily_revenue_dict}), 200
    except Exception as e:
        logger.error(f"Error in daily_revenue: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/top_customers', methods=['POST'])
def top_customers():
    try:
        df = load_and_clean_file(request)
        top_customers = df.groupby('CustomerID')['TotalPrice'].sum().nlargest(10).reset_index()
        top_customers['recommendation'] = 'Enroll in VIP program.'
        return jsonify({"top_customers": top_customers.to_dict(orient='records')}), 200
    except Exception as e:
        logger.error(f"Error in top_customers: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/top_products', methods=['POST'])
def top_products():
    try:
        df = load_and_clean_file(request)
        top_products = df.groupby('Description')['TotalPrice'].sum().nlargest(10).reset_index()
        top_products['recommendation'] = 'Promote heavily in marketing.'
        return jsonify({"top_products": top_products.to_dict(orient='records')}), 200
    except Exception as e:
        logger.error(f"Error in top_products: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/monthly_customer_acquisition', methods=['POST'])
def monthly_customer_acquisition():
    try:
        df = load_and_clean_file(request)
        df['FirstPurchaseDate'] = pd.to_datetime(df.groupby('CustomerID')['InvoiceDate'].transform('min'))
        df['YearMonth'] = df['FirstPurchaseDate'].dt.to_period('M')
        monthly_acquisition = df.groupby('YearMonth')['CustomerID'].nunique().reset_index()
        monthly_acquisition['YoY_Change'] = monthly_acquisition['CustomerID'].pct_change(periods=12).fillna(0)
        monthly_acquisition['recommendation'] = monthly_acquisition['YoY_Change'].apply(
            lambda x: 'Increase marketing spend to boost acquisition.' if x < -0.1
            else 'Sustain acquisition strategies.' if x > 0.1
            else 'Maintain current efforts.'
        )
        monthly_acquisition['YearMonth'] = monthly_acquisition['YearMonth'].astype(str)
        monthly_acquisition.rename(columns={'CustomerID': 'newCustomers'}, inplace=True)
        
        return jsonify({"monthly_acquisition": monthly_acquisition.to_dict(orient='records')}), 200
    except Exception as e:
        logger.error(f"Error in monthly_customer_acquisition: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/geographical_analysis', methods=['POST'])
def geographical_analysis():
    try:
        df = load_and_clean_file(request)
        if 'Country' not in df.columns:
            raise ValueError("CSV file must contain a 'Country' column")
        
        geographical_revenue = df.groupby('Country').agg({
            'TotalPrice': 'sum',
            'CustomerID': 'nunique'
        }).reset_index()
        geographical_revenue.rename(columns={'TotalPrice': 'RawRevenue', 'CustomerID': 'CustomerCount'}, inplace=True)
        geographical_revenue['RevenuePerCustomer'] = geographical_revenue['RawRevenue'] / geographical_revenue['CustomerCount']
        
        geographical_revenue['recommendation'] = geographical_revenue['RevenuePerCustomer'].apply(
            lambda x: 'High-value market; expand marketing.' if x > geographical_revenue['RevenuePerCustomer'].quantile(0.75)
            else 'Low-value market; optimize campaigns.' if x < geographical_revenue['RevenuePerCustomer'].quantile(0.25)
            else 'Stable market; maintain strategy.'
        )
        
        scaled = request.args.get('scaled', 'false').lower() == 'true'
        if scaled:
            output = geographical_revenue[['Country', 'RevenuePerCustomer', 'CustomerCount', 'recommendation']]
        else:
            output = geographical_revenue[['Country', 'RawRevenue', 'RevenuePerCustomer', 'CustomerCount', 'recommendation']]
        
        return jsonify({
            "geographical_revenue": output.to_dict(orient='records')
        }), 200
    except Exception as e:
        logger.error(f"Error in geographical_analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/product_return_rate', methods=['POST'])
def product_return_rate():
    try:
        df = load_and_clean_file(request)
        returns = df[df['Quantity'] < 0]
        return_rate = returns.groupby('Description')['Quantity'].sum().reset_index()
        total_sold = df[df['Quantity'] > 0].groupby('Description')['Quantity'].sum()
        return_rate['ReturnRate'] = return_rate['Quantity'].abs() / total_sold
        return_rate = return_rate.fillna(0)
        
        return_rate['recommendation'] = return_rate['ReturnRate'].apply(
            lambda x: 'Investigate quality issues.' if x > 0.1
            else 'Monitor returns.' if x > 0.02
            else 'Low returns; maintain quality.'
        )
        
        return jsonify({"product_return_rate": return_rate.to_dict(orient='records')}), 200
    except Exception as e:
        logger.error(f"Error in product_return_rate: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/customer_activity_heatmap', methods=['POST'])
def customer_activity_heatmap():
    try:
        df = load_and_clean_file(request)
        required_columns = ['InvoiceDate', 'InvoiceNo']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": f"CSV file must contain the following columns: {', '.join(required_columns)}"}), 400
        
        if df.empty:
            return jsonify({"error": "No valid data after cleaning InvoiceDate and InvoiceNo"}), 400
        
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        df = df.dropna(subset=['InvoiceDate'])
        
        df['Hour'] = df['InvoiceDate'].dt.hour.fillna(0).astype(int)
        df['DayOfWeek'] = df['InvoiceDate'].dt.dayofweek.fillna(0).astype(int)
        
        activity_heatmap = df.groupby(['DayOfWeek', 'Hour'])['InvoiceNo'].nunique().unstack(fill_value=0)
        
        activity_heatmap.columns = activity_heatmap.columns.astype(int)
        all_hours = pd.Index(range(24), name='Hour')
        activity_heatmap = activity_heatmap.reindex(columns=all_hours, fill_value=0)
        
        activity_data = []
        for day in activity_heatmap.index:
            row_data = {'DayOfWeek': int(day)}
            for hour in activity_heatmap.columns:
                row_data[f"Hour_{int(hour)}"] = int(activity_heatmap.loc[day, hour])
            activity_data.append(row_data)
        
        if not activity_heatmap.empty:
            hour_sums = activity_heatmap.sum()
            day_sums = activity_heatmap.sum(axis=1)
            
            peak_hour = int(hour_sums.idxmax()) if not hour_sums.empty else 0
            peak_day = int(day_sums.idxmax()) if not day_sums.empty else 0
        else:
            peak_hour = 0
            peak_day = 0
            
        day_names = {0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday'}
        recommendation = f"Peak activity on {day_names.get(peak_day, 'Unknown day')} at Hour {peak_hour}; schedule promotions accordingly."
        
        return jsonify({
            "activity_heatmap": activity_data,
            "peak_hour": peak_hour,
            "peak_day": peak_day,
            "peak_day_name": day_names.get(peak_day, 'Unknown'),
            "recommendation": recommendation
        }), 200
    except Exception as e:
        logger.error(f"Error in customer_activity_heatmap: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/seasonality_analysis', methods=['POST'])
def seasonality_analysis():
    try:
        df = load_and_clean_file(request)
        df['Month'] = pd.to_datetime(df['InvoiceDate']).dt.month.astype(int)
        seasonal_revenue = df.groupby('Month')['TotalPrice'].sum().reset_index()
        
        seasonal_revenue['recommendation'] = seasonal_revenue['TotalPrice'].apply(
            lambda x: 'High season; increase inventory.' if x > seasonal_revenue['TotalPrice'].quantile(0.75)
            else 'Low season; run promotions.' if x < seasonal_revenue['TotalPrice'].quantile(0.25)
            else 'Stable season; maintain strategy.'
        )
        
        return jsonify({
            "seasonal_revenue": seasonal_revenue.to_dict(orient='records')
        }), 200
    except Exception as e:
        logger.error(f"Error in seasonality_analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/retention_rate', methods=['POST'])
def retention_rate():
    try:
        df = load_and_clean_file(request)
        required_columns = ['InvoiceDate', 'CustomerID', 'InvoiceNo']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": f"CSV file must contain the following columns: {', '.join(required_columns)}"}), 400
        
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        df = df.dropna(subset=['InvoiceDate'])
        
        df['YearMonth'] = df['InvoiceDate'].dt.strftime('%Y-%m')
        cohort_data = df.groupby(['CustomerID', 'YearMonth'])['InvoiceNo'].nunique().reset_index()
        
        first_purchase = df.groupby('CustomerID')['InvoiceDate'].min().reset_index()
        first_purchase['CohortMonth'] = first_purchase['InvoiceDate'].dt.strftime('%Y-%m')
        
        cohort_data = cohort_data.merge(first_purchase[['CustomerID', 'CohortMonth']], on='CustomerID')
        
        cohort_data['YearMonth_Year'] = pd.to_datetime(cohort_data['YearMonth']).dt.year
        cohort_data['YearMonth_Month'] = pd.to_datetime(cohort_data['YearMonth']).dt.month
        cohort_data['CohortMonth_Year'] = pd.to_datetime(cohort_data['CohortMonth']).dt.year
        cohort_data['CohortMonth_Month'] = pd.to_datetime(cohort_data['CohortMonth']).dt.month
        
        cohort_data['YearMonth_Int'] = (cohort_data['YearMonth_Year'] * 12 + cohort_data['YearMonth_Month']).astype(int)
        cohort_data['CohortMonth_Int'] = (cohort_data['CohortMonth_Year'] * 12 + cohort_data['CohortMonth_Month']).astype(int)
        cohort_data['CohortIndex'] = (cohort_data['YearMonth_Int'] - cohort_data['CohortMonth_Int']).astype(int)
        
        retention_table = pd.pivot_table(
            cohort_data,
            values='CustomerID',
            index='CohortMonth',
            columns='CohortIndex',
            aggfunc='nunique'
        ).fillna(0)
        
        if retention_table.empty:
            return jsonify({
                "retention_data": [],
                "recommendation": "Insufficient data for retention analysis."
            }), 200
        
        cohort_sizes = retention_table[0]
        retention_rates = retention_table.div(cohort_sizes, axis=0).round(2)
        
        if retention_rates.shape[1] > 1:
            avg_retention = retention_rates.iloc[:, 1:].mean().mean()
        else:
            avg_retention = 0
        
        if avg_retention < 0.3:
            recommendation = 'Low retention rate of {:.1%}; focus on loyalty programs and customer engagement.'.format(avg_retention)
        elif avg_retention < 0.6:
            recommendation = 'Moderate retention rate of {:.1%}; enhance customer engagement with personalized offers.'.format(avg_retention)
        else:
            recommendation = 'High retention rate of {:.1%}; maintain current strategies and consider referral programs.'.format(avg_retention)
        
        retention_data = []
        for cohort in retention_rates.index:
            row = {'cohort': str(cohort)}
            for i in retention_rates.columns:
                if i in retention_rates.loc[cohort]:
                    row[f'month_{i}'] = float(retention_rates.loc[cohort, i])
                else:
                    row[f'month_{i}'] = 0.0
            retention_data.append(row)
        
        return jsonify({
            "retention_data": retention_data,
            "avg_retention": float(avg_retention),
            "recommendation": recommendation
        }), 200
    except Exception as e:
        logger.error(f"Error in retention_rate: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/sales_drop_analysis', methods=['POST'])
def sales_drop_analysis_endpoint():
    try:
        df = load_and_clean_file(request)
        factors = sales_drop_analysis(df)
        return jsonify({"sales_drop_factors": factors}), 200
    except Exception as e:
        logger.error(f"Error in sales_drop_analysis_endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/marketing_recommendations', methods=['POST'])
def marketing_recommendations_endpoint():
    try:
        df = load_and_clean_file(request)
        rfm = perform_rfm_analysis(df)
        rules = product_affinity_analysis(df)
        recommendations = marketing_recommendations(rfm, rules)
        return jsonify({"marketing_recommendations": recommendations}), 200
    except Exception as e:
        logger.error(f"Error in marketing_recommendations_endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)