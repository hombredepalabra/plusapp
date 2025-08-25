from flask import jsonify

def success_response(data=None, status_code=200):
    """Standard success response format"""
    response_data = {"success": True}
    if data is not None:
        response_data.update(data)
    return jsonify(response_data), status_code

def error_response(message, status_code=400, details=None):
    """Standard error response format"""
    response_data = {
        "success": False,
        "error": message
    }
    if details:
        response_data["details"] = details
    return jsonify(response_data), status_code