"""WhatsApp utility template delivery for the local SQLite CRM."""
import json
import os
import re
from datetime import datetime
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import floor


def config():
    phone_id = os.getenv('MANGOSTEEN_WHATSAPP_PHONE_ID', '').strip()
    token = os.getenv('MANGOSTEEN_WHATSAPP_TOKEN', '').strip()
    name = os.getenv('MANGOSTEEN_WHATSAPP_RESERVATION_TEMPLATE', '').strip()
    language = os.getenv('MANGOSTEEN_WHATSAPP_TEMPLATE_LANGUAGE', '').strip() or 'en'
    version = os.getenv('MANGOSTEEN_WHATSAPP_GRAPH_VERSION', '').strip() or 'v25.0'
    if token and re.fullmatch(r'[0-9]+', phone_id) and re.fullmatch(r'[a-z0-9_]+', name) and re.fullmatch(r'[a-z]{2,3}(?:_[A-Z]{2})?', language) and re.fullmatch(r'v[0-9]+\.0', version):
        return phone_id, token, name, language, version
    return None


def recipient(phone):
    if not re.fullmatch(r'\+?[0-9 ()-]+', phone):
        return ''
    digits = re.sub(r'[^0-9]', '', phone)
    if phone.startswith('+') or digits.startswith('00'):
        number = digits if phone.startswith('+') else digits[2:]
        return number if re.fullmatch(r'[1-9][0-9]{7,14}', number) else ''
    return '91' + digits[-10:] if re.fullmatch(r'(?:0|91)?[6-9][0-9]{9}', digits) else ''


def prepare(booking, credentials):
    prior = booking.get('whatsappConfirmation', {})
    if prior and prior['status'] not in ('no_consent', 'invalid_phone', 'not_configured', 'failed'):
        return ''
    to = recipient(booking['phone'])
    if not booking.get('whatsappConsent'):
        status = 'no_consent'
    elif not to:
        status = 'invalid_phone'
    else:
        status = 'sending' if credentials else 'not_configured'
    booking['whatsappConfirmation'] = dict(status=status, at=floor.stamp(), attempt=prior.get('attempt', 0) + (status == 'sending'))
    return to if status == 'sending' else ''


def deliver(booking, to, credentials):
    phone_id, token, name, language, version = credentials
    date = datetime.fromisoformat(f"{booking['date']}T{booking['time']}:00")
    params = [booking['name'], date.strftime('%d %b %Y'), date.strftime('%I:%M %p').lstrip('0'),
              str(booking['guests']), f"MG-{booking['id']:06d}"]
    payload = dict(messaging_product='whatsapp', to=to, type='template', template=dict(
        name=name, language=dict(code=language), components=[dict(type='body', parameters=[
            dict(type='text', text=' '.join(value.split())) for value in params])]))
    request = Request(f'https://graph.facebook.com/{version}/{phone_id}/messages', data=json.dumps(payload).encode(),
                      headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    outcome = dict(booking['whatsappConfirmation'], status='unverified', at=floor.stamp())
    try:
        with urlopen(request, timeout=6) as response:
            message_id = json.load(response).get('messages', [{}])[0].get('id')
        if isinstance(message_id, str) and message_id:
            outcome.update(status='submitted', messageId=message_id)
    except HTTPError as error:
        try:
            if 400 <= error.code < 500 and json.load(error).get('error'):
                outcome['status'] = 'failed'
        except (ValueError, OSError):
            pass
        finally:
            error.close()
    except (ValueError, OSError, IndexError):
        pass
    return outcome
