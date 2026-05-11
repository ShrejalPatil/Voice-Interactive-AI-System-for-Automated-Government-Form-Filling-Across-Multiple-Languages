from flask import Flask, request, jsonify, session
from flask_cors import CORS
import speech_recognition as sr
from gtts import gTTS
import os
import json
from langdetect import detect
from database import init_db, save_application, get_all_applications, update_application_status

# Initialize the database
init_db()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret-key-for-session'

# Expanded scheme dataset
# ...existing code...

# In-memory application tracking (per session)
def get_applications():
    if 'applications' not in session:
        session['applications'] = {}
    return session['applications']

import datetime
import random
import string
from database import get_connection

def generate_application_id():
    today = datetime.date.today().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.digits, k=4))
    return f"APP{today}-{random_part}"

@app.route('/api/apply', methods=['POST'])
def apply_scheme():
    data = request.json or {}
    scheme_name = data.get('scheme_name')
    form_data = data.get('application_data', {})

    if not scheme_name:
        return jsonify({'error': 'Scheme name required'}), 400

    try:
        # Generate application ID and add it to form data
        app_id = generate_application_id()
        form_data['application_id'] = app_id
        
        # Save to database
        app_db_id = save_application(scheme_name, form_data)
        
        return jsonify({
            'success': True,
            'application_id': app_id,
            'application_data': form_data,
            'db_id': app_db_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-applications', methods=['GET'])
def get_all_apps():
    try:
        apps = get_all_applications()
        return jsonify({'applications': apps})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-status', methods=['POST'])
def update_status():
    data = request.json or {}
    app_id = data.get('application_id')
    status = data.get('status', 'Approved')

    if not app_id:
        return jsonify({'error': 'Application ID required'}), 400

    try:
        success = update_application_status(app_id, status)
        if success:
            return jsonify({'success': True, 'status': status})
        else:
            return jsonify({'error': 'Application not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications', methods=['GET'])
def get_all_saved_applications():
    try:
        records = get_all_applications()
        # Ensure we return a proper JSON response
        return jsonify(records) if isinstance(records, list) else jsonify([])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/all-schemes-with-stats', methods=['POST'])
def all_schemes_with_stats():
    """Return all schemes with total applications and applied percentage, in selected language."""
    req = request.json or {}
    lang = req.get('language', 'en')

    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # SQLite doesn't support dictionary cursor, so we'll fetch as tuples and convert
        cursor.execute("""
            SELECT scheme_name, COUNT(*) as total_apps 
            FROM applications 
            GROUP BY scheme_name
        """)
        
        # Convert results to list of dicts
        counts = [{'scheme_name': row[0], 'total_apps': row[1]} for row in cursor.fetchall()]
        
        app_count_map = {row['scheme_name']: row['total_apps'] for row in counts}
        total_all = sum(app_count_map.values()) or 1  # avoid division by zero

        response = []
        for s in schemes_data['schemes']:
            total_apps = app_count_map.get(s['name'], 0)
            percentage = round((total_apps / total_all) * 100, 2)
            response.append({
                'name': s['name'],
                'description': s['description'].get(lang, s['description'].get('en')),
                'total_applications': total_apps,
                'applied_percentage': percentage,
            })

        return jsonify({'schemes': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint to get preview of submitted application
@app.route('/api/application-preview', methods=['POST'])
def application_preview():
    data = request.json or {}
    scheme_name = data.get('scheme_name')
    applications = get_applications()
    app_data = applications.get(scheme_name)
    if not app_data:
        return jsonify({'error': 'No application found'}), 404
    return jsonify({'application': app_data})

# Endpoint to update a field in application
@app.route('/api/update-application-field', methods=['POST'])
def update_application_field():
    data = request.json or {}
    scheme_name = data.get('scheme_name')
    field = data.get('field')
    value = data.get('value')
    applications = get_applications()
    if scheme_name not in applications:
        return jsonify({'error': 'No application found'}), 404
    applications[scheme_name][field] = value
    session['applications'] = applications
    return jsonify({'success': True, 'application': applications[scheme_name]})

# Conversation flow templates
def convert_kannada_to_english(number_str):
    """Convert Kannada numerals to English digits."""
    kannada_digits = {'೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
                     '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9'}
    result = []
    for char in str(number_str):
        result.append(kannada_digits.get(char, char))
    return ''.join(result)

def is_valid_phone(phone):
    """Check if phone number is exactly 10 digits."""
    # First convert any Kannada numerals to English
    phone = convert_kannada_to_english(phone)
    # Remove any remaining non-digit characters
    digits = ''.join(filter(str.isdigit, str(phone)))
    return len(digits) == 10, digits  # Return both validity and cleaned digits

conversation_flow = {
    'en': {
        'welcome': "Hello! I'm here to help you fill government forms. I'll ask a few questions.",
        'ask_name': "Please tell me your name.",
        'ask_phone': "What is your phone number? (10 digits only, e.g., 9876543210)",
        'invalid_phone': "Please enter a valid 10-digit phone number (e.g., 9876543210).",
        'ask_state': "Which state do you live in?",
        'ask_district': "Which district are you from?",
        'ask_age': "What is your age? in numbers.",
        'ask_category': "What is your category? Say SC, ST, OBC, or General.",
        'ask_income': "What is your annual income?",
        'confirm_details': "Thanks — I have your details. Shall I check eligible schemes?",
        'processing': "Checking eligible schemes...",
        'no_schemes': "No eligible schemes found for your profile.",
    },
    'hi': {
        'welcome': "नमस्ते! मैं आपकी सरकारी फॉर्म भरने में मदद करूंगा। कृपया निम्नलिखित जानकारी दें:",
        'ask_name': "आपका पूरा नाम क्या है?",
        'ask_phone': "आपका 10 अंकों का मोबाइल नंबर दर्ज करें (उदाहरण: 9876543210)",
        'invalid_phone': "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (उदाहरण: 9876543210)",
        'ask_state': "आप किस राज्य में रहते हैं? (उदाहरण: महाराष्ट्र, उत्तर प्रदेश)",
        'ask_district': "आप किस जिले से हैं? (उदाहरण: मुंबई, लखनऊ)",
        'ask_age': "आपकी आयु कितनी है? केवल संख्या में उत्तर दें।",
        'ask_category': "आप किस श्रेणी से संबंधित हैं? (SC, ST, OBC, या General)",
        'ask_income': "आपकी वार्षिक आय कितनी है? (केवल संख्या में उत्तर दें)",
        'confirm_details': "धन्यवाद! क्या मैं आपके लिए योग्य योजनाएं खोजूं? 'हां' या 'नहीं' में उत्तर दें।",
        'processing': "आपके लिए योग्य योजनाएं खोजी जा रही हैं...",
        'no_schemes': "आपकी प्रोफाइल के अनुसार कोई योग्य योजना उपलब्ध नहीं है।",
    },
    'kn': {
        'welcome': "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಸರ್ಕಾರಿ ಅರ್ಜಿಗಳನ್ನು ಭರ್ತಿ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ದಯವಿಟ್ಟು ಈ ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ನೀಡಿ:",
        'ask_name': "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರೇನು?",
        'ask_phone': "ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (ಉದಾಹರಣೆ: 9876543210)",
        'invalid_phone': "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (ಉದಾಹರಣೆ: 9876543210)",
        'ask_state': "ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ? (ಉದಾಹರಣೆ: ಕರ್ನಾಟಕ, ಮಹಾರಾಷ್ಟ್ರ)",
        'ask_district': "ನೀವು ಯಾವ ಜಿಲ್ಲೆಯವರು? (ಉದಾಹರಣೆ: ಬೆಂಗಳೂರು, ಮೈಸೂರು)",
        'ask_age': "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು? ಕೇವಲ ಸಂಖ್ಯೆಯಲ್ಲಿ ಉತ್ತರಿಸಿ.",
        'ask_category': "ನೀವು ಯಾವ ವರ್ಗಕ್ಕೆ ಸೇರಿದ್ದೀರಿ? (SC, ST, OBC, ಅಥವಾ General)",
        'ask_income': "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು? (ಕೇವಲ ಸಂಖ್ಯೆಯಲ್ಲಿ ಉತ್ತರಿಸಿ)",
        'confirm_details': "ಧನ್ಯವಾದಗಳು! ನಾನು ನಿಮಗೆ ಅರ್ಹವಾದ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲಿ? 'ಹೌದು' ಅಥವಾ 'ಇಲ್ಲ' ಎಂದು ಉತ್ತರಿಸಿ.",
        'processing': "ನಿಮಗೆ ಅರ್ಹವಾದ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
        'no_schemes': "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ಗೆ ಅನುಗುಣವಾದ ಯಾವುದೇ ಯೋಗ್ಯ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ。",
    }
}

# Expanded scheme dataset
schemes_data = {
    'schemes': [
        {
            'name': 'PM Kisan Samman Nidhi',
            'min_age': 18,
            'max_age': 100,
            'max_income': 600000,
            'eligible_castes': ['SC', 'ST', 'OBC', 'General'],
            'description': {
                'en': 'Financial benefit of Rs.6000 per year for farmer families',
                'hi': 'किसान परिवारों के लिए 6000 रुपये प्रति वर्ष का वित्तीय लाभ',
                'kn': 'ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವಾರ್ಷಿಕ 6000 ರೂ. ಆರ್ಥಿಕ ಪ್ರಯೋಜನ'
            },
            'benefits': {
                'en': ['Annual support of Rs.6000', 'Direct bank transfer'],
                'hi': ['6000 रुपये का वार्षिक सहयोग', 'सीधा बैंक ट्रांसफर'],
                'kn': ['ವಾರ್ಷಿಕ 6000 ರೂ. ಸಹಾಯ', 'ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ']
            },
            'required_documents': {
                'en': ['Aadhaar Card', 'Bank account details'],
                'hi': ['आधार कार्ड', 'बैंक खाता विवरण'],
                'kn': ['ಆಧಾರ್ ಕಾರ್ಡ್', 'ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರಗಳು']
            }
        },
        {
            'name': 'SC/ST Scholarship',
            'min_age': 16,
            'max_age': 25,
            'max_income': 250000,
            'eligible_castes': ['SC', 'ST'],
            'description': {
                'en': 'Educational scholarship for SC/ST students',
                'hi': 'एससी/एसटी छात्रों के लिए छात्रवृत्ति',
                'kn': 'ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿದ್ಯಾರ್ಥಿ ವೇತನ'
            },
            'benefits': {
                'en': ['Tuition fee support', 'Monthly stipend'],
                'hi': ['शिक्षु कोष', 'मासिक वजीफा'],
                'kn': ['ಶಿಕ್ಷಣ ಶುಲ್ಕ ಸಹಾಯ', 'ಮಾಸಿಕ ವಜೀಫಾ']
            },
            'required_documents': {
                'en': ['Caste certificate', 'Income certificate'],
                'hi': ['जाति प्रमाण पत्र', 'आय प्रमाण पत्र'],
                'kn': ['ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ', 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ']
            }
        },
        {
            'name': 'Old Age Pension',
            'min_age': 60,
            'max_age': 120,
            'max_income': 200000,
            'eligible_castes': ['SC', 'ST', 'OBC', 'General'],
            'description': {
                'en': 'Monthly pension for senior citizens above 60 years',
                'hi': '60 वर्ष से ऊपर के वरिष्ठ नागरिकों के लिए मासिक पेंशन',
                'kn': '60 ವರ್ಷಕ್ಕಿಂತ ಮೇಲ್ಪಟ್ಟ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮಾಸಿಕ ಪಿಂಚಣಿ'
            },
            'benefits': {
                'en': ['Monthly pension', 'Medical benefits'],
                'hi': ['मासिक पेंशन', 'चिकित्सा लाभ'],
                'kn': ['ಮಾಸಿಕ ಪಿಂಚಣಿ', 'ವೈದ್ಯಕೀಯ ಸೌಲಭ್ಯ']
            },
            'required_documents': {
                'en': ['Age proof', 'Bank account details'],
                'hi': ['आयु प्रमाण पत्र', 'बैंक खाता विवरण'],
                'kn': ['ವಯಸ್ಸಿನ ಪ್ರಮಾಣಪತ್ರ', 'ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರಗಳು']
            }
        },
        {
            'name': 'OBC Business Loan Subsidy',
            'min_age': 21,
            'max_age': 55,
            'max_income': 800000,
            'eligible_castes': ['OBC'],
            'description': {
                'en': 'Subsidy on business loans for OBC entrepreneurs',
                'hi': 'ओबीसी उद्यमियों के लिए व्यापार ऋण पर सब्सिडी',
                'kn': 'OBC ಉದ್ಯಮಿಗಳಿಗೆ ವ್ಯವಹಾರ ಸಾಲದ ಸಬ್ಸಿಡಿ'
            },
            'benefits': {
                'en': ['Interest subsidy', 'Loan up to 5 lakhs'],
                'hi': ['ब्याज सब्सिडी', '5 लाख तक का ऋण'],
                'kn': ['ಬಡ್ಡಿದರ ಸಬ್ಸಿಡಿ', '5 ಲಕ್ಷವರೆಗೆ ಸಾಲ']
            },
            'required_documents': {
                'en': ['Caste certificate', 'Business plan'],
                'hi': ['जाति प्रमाण पत्र', 'व्यवसाय योजना'],
                'kn': ['ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ', 'ವ್ಯವಹಾರ ಯೋಜನೆ']
            }
        },
        {
            'name': 'Girl Child Education Grant',
            'min_age': 6,
            'max_age': 18,
            'max_income': 300000,
            'eligible_castes': ['SC', 'ST', 'OBC', 'General'],
            'description': {
                'en': 'Grant for education of girl children',
                'hi': 'बालिकाओं की शिक्षा के लिए अनुदान',
                'kn': 'ಹುಡುಗಿಯರ ಶಿಕ್ಷಣಕ್ಕೆ ಅನುದಾನ'
            },
            'benefits': {
                'en': ['Annual grant', 'School supplies'],
                'hi': ['वार्षिक अनुदान', 'स्कूल सामग्री'],
                'kn': ['ವಾರ್ಷಿಕ ಅನುದಾನ', 'ಶಾಲಾ ಸಾಮಗ್ರಿಗಳು']
            },
            'required_documents': {
                'en': ['Birth certificate', 'School ID card'],
                'hi': ['जन्म प्रमाण पत्र', 'स्कूल आईडी कार्ड'],
                'kn': ['ಹುಟ್ಟಿದ ಪ್ರಮಾಣಪತ್ರ', 'ಶಾಲಾ ಐಡಿ ಕಾರ್ಡ್']
            }
        }
    ]
}


@app.route('/api/start-conversation', methods=['POST'])
def start_conversation():
    payload = request.json or {}
    lang = payload.get('language', 'en')
    flow = conversation_flow.get(lang, conversation_flow['en'])
    welcome = flow['welcome']
    first_step = 'ask_name'
    first_question = flow[first_step]
    return jsonify({'messages': [
        {'text': welcome, 'isBot': True},
        {'text': first_question, 'isBot': True}
    ], 'current_step': first_step})


def check_eligibility(data):
    # Input validation
    if not all(key in data for key in ['age', 'income', 'caste']):
        return {'error': 'Missing required fields'}

    try:
        age = int(data.get('age', 0))
        if age <= 0:
            return {'error': 'Invalid age'}
    except (ValueError, TypeError):
        return {'error': 'Invalid age format'}

    try:
        income = float(str(data.get('income', '0')).replace(',', ''))
        if income < 0:
            return {'error': 'Income cannot be negative'}
    except (ValueError, TypeError):
        return {'error': 'Invalid income format'}

    # Case-insensitive caste matching
    caste = (data.get('caste') or '').strip().upper()
    if not caste:
        return {'error': 'Caste is required'}

    lang = data.get('language', 'en').lower()
    if lang not in ['en', 'hi', 'kn']:
        lang = 'en'

    eligible = []
    for s in schemes_data['schemes']:
        eligible_castes = [c.upper() for c in s.get('eligible_castes', [])]
        
        age_ok = s.get('min_age', 0) <= age <= s.get('max_age', 999)
        income_ok = income <= s.get('max_income', float('inf'))
        caste_ok = not eligible_castes or caste in eligible_castes

        if age_ok and income_ok and caste_ok:
            scheme_info = {
                'name': s['name'],
                'description': s['description'].get(lang, s['description'].get('en', '')),
                'benefits': s.get('benefits', {}).get(lang, s.get('benefits', {}).get('en', [])),
                'required_documents': s.get('required_documents', {}).get(lang, s.get('required_documents', {}).get('en', [])),
                'min_age': s.get('min_age'),
                'max_age': s.get('max_age'),
                'max_income': s.get('max_income'),
                'eligible_castes': s.get('eligible_castes')
            }
            eligible.append(scheme_info)

    return {
        'success': True,
        'schemes': eligible,
        'count': len(eligible),
        'criteria': {
            'age': age,
            'income': income,
            'caste': caste,
            'language': lang
        }
    }

@app.route('/api/conversation', methods=['POST'])
def conversation():
    data = request.json or {}
    current_step = data.get('current_step')
    response = data.get('response', '')
    lang = data.get('language', 'en')
    user_data = data.get('user_data', {})
    next_step = None
    messages = []

    # Process the current step
    if current_step == 'ask_name':
        user_data['name'] = response
        next_step = 'ask_phone'
    elif current_step == 'ask_phone':
        # Validate phone number (handles both English and Kannada digits)
        is_valid, cleaned_digits = is_valid_phone(response)
        if is_valid:
            user_data['phone'] = cleaned_digits
            next_step = 'ask_state'
        else:
            # Stay on the same step and show error message
            next_step = 'ask_phone'
            messages.append({
                'text': conversation_flow[lang].get('invalid_phone', 'Please enter a valid 10-digit phone number.'),
                'isBot': True
            })
    elif current_step == 'ask_state':
        user_data['state'] = response
        next_step = 'ask_district'
    elif current_step == 'ask_district':
        user_data['district'] = response
        next_step = 'ask_age'
    elif current_step == 'ask_age':
        user_data['age'] = response
        next_step = 'ask_category'
    elif current_step == 'ask_category':
        user_data['category'] = response
        next_step = 'ask_income'
    elif current_step == 'ask_income':
        user_data['income'] = response
        next_step = 'confirm_details'
    elif current_step == 'confirm_details':
        # Check for any variation of 'yes' in the response (in multiple languages)
        confirm_words = ['yes', 'y', 'haan', 'hoon', 'ಹೌದು', 'yeah', 'yup', 'houdu', 'ಹೌದು', 'ಹೂಂ']
        if any(confirm_word in response.lower() for confirm_word in confirm_words):
            # Prepare data for eligibility check
            eligibility_data = {
                'age': int(user_data.get('age', 0)),
                'income': float(str(user_data.get('income', '0')).replace(',', '')),
                'caste': user_data.get('category', ''),
                'language': lang
            }
            
            # Get eligible schemes
            eligible_schemes = check_eligibility(eligibility_data)
            
            if eligible_schemes.get('success') and eligible_schemes.get('schemes'):
                scheme_list = "\n".join([f"- {s['name']}" for s in eligible_schemes['schemes']])
                return jsonify({
                    'status': 'completed',
                    'user_data': user_data,
                    'eligible_schemes': eligible_schemes['schemes'],
                    'message': f'Here are your eligible schemes:\n{scheme_list}'
                })
            else:
                return jsonify({
                    'status': 'completed',
                    'user_data': user_data,
                    'eligible_schemes': [],
                    'message': 'No eligible schemes found based on your information.'
                })
        else:
            next_step = 'ask_name'  # Start over if not confirmed
    else:
        next_step = 'ask_name'

    # Get the next question
    next_message = conversation_flow.get(lang, conversation_flow['en']).get(next_step, '')
    
    return jsonify({
        'status': 'in_progress',
        'message': next_message,
        'current_step': next_step,
        'user_data': user_data
    })

# Keep the route for direct API calls
@app.route('/api/check-eligibility', methods=['POST'])
def check_eligibility_route():
    data = request.json or {}
    result = check_eligibility(data)
    return jsonify(result)


@app.route('/api/process-voice', methods=['POST'])
def process_voice():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    audio_file = request.files['audio']
    recognizer = sr.Recognizer()
    try:
        # save temporary file because SpeechRecognition needs a filename-like object
        temp_path = 'temp_audio.wav'
        audio_file.save(temp_path)
        with sr.AudioFile(temp_path) as source:
            audio = recognizer.record(source)
        text = recognizer.recognize_google(audio)
        os.remove(temp_path)
        detected = detect(text) if text else 'en'
        return jsonify({'text': text, 'detected_language': detected})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/scheme-details', methods=['POST'])
def scheme_details():
    data = request.json or {}
    name = data.get('scheme_name')
    lang = data.get('language', 'en').lower()
    
    if not name:
        return jsonify({'success': False, 'error': 'scheme_name is required'}), 400
        
    if lang not in ['en', 'hi', 'kn']:
        lang = 'en'  # default to English if invalid language
    
    for s in schemes_data['schemes']:
        if s['name'].lower() == name.lower():
            return jsonify({
                'success': True,
                'scheme': {
                    'name': s['name'],
                    'description': s['description'].get(lang, s['description'].get('en', '')),
                    'benefits': s.get('benefits', {}).get(lang, s.get('benefits', {}).get('en', [])),
                    'required_documents': s.get('required_documents', {}).get(lang, s.get('required_documents', {}).get('en', [])),
                    'min_age': s.get('min_age'),
                    'max_age': s.get('max_age'),
                    'max_income': s.get('max_income'),
                    'eligible_castes': s.get('eligible_castes', [])
                }
            })
    
    return jsonify({
        'success': False,
        'error': f'Scheme "{name}" not found',
        'available_schemes': [s['name'] for s in schemes_data['schemes']]
    }), 404


@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.json or {}
    text = data.get('text', '')
    lang = data.get('language', 'en')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    try:
        tts = gTTS(text=text, lang=lang)
        fname = 'tts_temp.mp3'
        tts.save(fname)
        with open(fname, 'rb') as f:
            data_bytes = f.read()
        os.remove(fname)
        return (data_bytes, 200, {'Content-Type': 'audio/mpeg'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)