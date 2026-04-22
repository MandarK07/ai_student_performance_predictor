import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration from environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USERNAME)

async def send_intervention_email(student_email: str, student_name: str, intervention_type: str, description: str):
    """
    Sends an email notification to the student about a new intervention.
    If SMTP credentials are not configured, it logs the message to console.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"DEBUG [Email MOCK]: To: {student_email}")
        print(f"Subject: Support Action Initiated: {intervention_type}")
        print(f"Body: Hello {student_name}, a {intervention_type} intervention has been created: {description}")
        return True

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = student_email
    msg['Subject'] = f"Support Action Initiated: {intervention_type}"

    body = f"""
Hello {student_name},

This is an automated notification from the Academic Support Team.

A new support intervention has been recorded to assist with your academic progress:
- Type: {intervention_type}
- Details: {description}

Please check in with your teacher or academic advisor to discuss the next steps and how we can support you.

Best regards,
Academic Support Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Use a context manager to ensure the connection is closed
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"INFO: Email sent to {student_email} for {intervention_type} intervention.")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {student_email}: {str(e)}")
        return False
