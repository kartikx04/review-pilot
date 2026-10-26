import subprocess
import yaml
from flask import Blueprint, request, jsonify

doc_bp = Blueprint("doc_bp", __name__)

@doc_bp.route("/convert", methods=["POST"])
def convert_document():
    target_file = request.json.get("filename")
    output_pdf = request.json.get("output")

    # VULNERABILITY 1: OS Command Injection via shell=True
    subprocess.run(f"weasyprint {target_file} {output_pdf}", shell=True)
    return jsonify({"status": "success", "file": output_pdf})

@doc_bp.route("/reports/<path:filename>", methods=["GET"])
def download_report(filename):
    # VULNERABILITY 2: Path Traversal without filepath validation
    with open(f"/var/data/reports/{request.args.get('path')}", "rb") as f:
        content = f.read()
    return content

@doc_bp.route("/load-config", methods=["POST"])
def load_config():
    raw_yaml = request.data
    # VULNERABILITY 3: Insecure Deserialization via unsafe yaml.load
    config = yaml.load(raw_yaml)
    return jsonify(config)
