import json
import hashlib
import os

ACTIVE_MAPPING = None

def load_gime_v0_1():
    global ACTIVE_MAPPING
    if ACTIVE_MAPPING is not None:
        return ACTIVE_MAPPING

    current_path = os.path.dirname(os.path.abspath(__file__))
    while not os.path.exists(os.path.join(current_path, 'assets')):
        parent = os.path.dirname(current_path)
        if parent == current_path:
            break
        current_path = parent
        
    filepath = os.path.join(current_path, 'assets', 'lenses', 'gime', 'v0.1', 'mapping.json')
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = f.read()
    
    mapping = json.loads(raw)

    if mapping.get('lens') != 'GIME':
        raise Exception('Invalid lens')
    if mapping.get('version') != 'v0.1':
        raise Exception('Invalid version')

    stored_checksum = mapping.get('checksum')
    import re
    blanked = re.sub(r'"checksum":\s*".*?"', '"checksum": ""', raw)
    digest = hashlib.sha256(blanked.encode('utf-8')).hexdigest()

    if digest != stored_checksum:
        raise Exception('Checksum mismatch')
    
    import datetime
    boot_log = {
        "event": "lens_loaded",
        "lens_name": "GIME",
        "lens_version": "v0.1",
        "lens_checksum": stored_checksum,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }
    print(json.dumps(boot_log))

    ACTIVE_MAPPING = mapping
    return ACTIVE_MAPPING

if __name__ == "__main__":
    load_gime_v0_1()
