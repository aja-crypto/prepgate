import re

p = r'C:\Users\purru\OneDrive\GATE 2026\gate2027\frontend\src\pages\AICoachPage.jsx'
s = open(p, 'r', encoding='utf-8').read()

old_dangerous = r'''<div className="text-sm leading-relaxed whitespace-pre-line text-text [&_strong]:text-primary" dangerouslySetInnerHTML={{ __html: msg.text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') }} />'''

new_safe = r'''<div className="text-sm leading-relaxed whitespace-pre-line text-text [&_strong]:text-primary">
                          {msg.text.split(/(\*\*.+?\*\*)/g).map((part, i) =>
                            part.startsWith('**') ? (
                              <strong key={i}>{part.slice(2, -2)}</strong>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </div>'''

if old_dangerous in s:
    s = s.replace(old_dangerous, new_safe)
    open(p, 'w', encoding='utf-8').write(s)
    print('OK - AICoachPage.jsx fixed')
else:
    print('NOT FOUND - pattern mismatch')
    # Try a partial match
    idx = s.find('dangerouslySetInnerHTML={{ __html: msg.text.replace')
    if idx != -1:
        print(f'Found at {idx}')
        print(repr(s[idx:idx+300]))
