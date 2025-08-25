from utils.response import error_response

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present and not empty"""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            missing_fields.append(field)
    
    if missing_fields:
        return error_response(f"Missing required fields: {', '.join(missing_fields)}", 400)
    
    return None