from flask import Flask, request, jsonify, send_file
import os, random
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta
import tempfile

app = Flask(__name__)

# ========================= Secure File Wiper =========================
def secure_wipe(path, passes=3):
    if not os.path.isfile(path):
        return False

    length = os.path.getsize(path)
    with open(path, "wb") as f:
        for _ in range(passes):
            f.seek(0)
            f.write(os.urandom(length))
            f.flush()
            os.fsync(f.fileno())
    os.remove(path)
    return True

@app.route('/wipe', methods=['POST'])
def wipe():
    data = request.json
    file_path = data.get("path")

    if not file_path or not os.path.exists(file_path):
        return jsonify({"status": "error", "msg": "File not found"}), 404

    success = secure_wipe(file_path)
    if success:
        return jsonify({"status": "ok", "msg": "File securely wiped"})
    return jsonify({"status": "error", "msg": "Unable to wipe file"}), 500

# ========================= Certificate Generator =========================
@app.route('/certgen', methods=['POST'])
def certgen():
    data = request.json
    common_name = data.get("common_name", "localhost")

    # Generate private key
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    # Build subject + issuer (self-signed)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.utcnow())
        .not_valid_after(datetime.utcnow() + timedelta(days=365))
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=None),
            critical=True,
        )
        .sign(key, hashes.SHA256())
    )

    # Write to temporary files
    cert_file = tempfile.NamedTemporaryFile(delete=False, suffix=".crt")
    key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".key")

    cert_file.write(cert.public_bytes(serialization.Encoding.PEM))
    key_file.write(key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ))

    cert_file.close()
    key_file.close()

    return jsonify({
        "certificate_path": cert_file.name,
        "private_key_path": key_file.name
    })

# ========================= Main =========================
if __name__ == "__main__":
    app.run(debug=True, port=5000)
