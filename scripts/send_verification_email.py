import json, os, smtplib, ssl, sys
from email.message import EmailMessage

recipient, code = json.load(sys.stdin)
sender = os.environ['SMTP_FROM']
message = EmailMessage()
message['From'], message['To'] = sender, recipient
message['Subject'] = '换一圈邮箱验证码'
message.set_content(f'你的邮箱验证码为 {code}，10 分钟内有效。若非本人操作，请忽略。')
host = os.environ['SMTP_HOST']
tls = os.environ.get('SMTP_MODE', 'ssl') == 'ssl'
port = int(os.environ.get('SMTP_PORT', '465' if tls else '587'))
context = ssl.create_default_context()
client = smtplib.SMTP_SSL(host, port, timeout=10, context=context) if tls else smtplib.SMTP(host, port, timeout=10)
with client:
    if not tls:
        client.starttls(context=context)
    if os.environ.get('SMTP_USER'):
        client.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
    client.send_message(message)
