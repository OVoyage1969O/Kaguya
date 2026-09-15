import json, socket, sys
from pathlib import Path

payload = {'type': 'execute_code', 'params': {'code': Path(sys.argv[1]).read_text(encoding='utf-8')}} if len(sys.argv)>1 else {'type':'get_scene_info','params':{}}
with socket.create_connection(('127.0.0.1', 9876), timeout=15) as s:
    s.settimeout(240)
    s.sendall(json.dumps(payload).encode())
    data=b''
    while True:
        chunk=s.recv(65536)
        if not chunk: break
        data+=chunk
        try:
            result=json.loads(data)
            print(json.dumps(result,ensure_ascii=False,indent=2))
            break
        except (json.JSONDecodeError,UnicodeDecodeError): pass
