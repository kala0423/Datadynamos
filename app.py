import streamlit as st
import os
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta
import tempfile

st.set_page_config(page_title="Secure Data Wiper & Certificate Generator")

st.title("🔐 Secure Data Wiper & Certificate Generator")

# ================= SECURE FILE WIPER =================
st.header("🧹 Secure File Wiper")

uploaded_file = st.file_uploader("Upload a file to securely wipe")

def secure_wipe(file_path, passes=3):
    size = os.path.getsize(file_path)
    with open(file_path, "wb") as f:
        for _ in range(passes):
            f.seek(0)
            f.write(os.urandom(size))
            f.flush()
            os.fsync(f.fileno())
    os.remove(file_path)

if uploaded_file:
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.write(uploaded_file.read())
    temp_file.close()

    if st.button("Securely Wipe File"):
        secure_wipe(temp_file.name)
        st.success("✅ File securely wiped (NIST-style overwrite)")

# ================= CERTIFICATE GENERATOR =================
st.header("📜 Certificate Generator")

common_name = st.text_input("Common Name (CN)", "example.com")

if st.button("Generate Certificate"):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

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
        .sign(key, hashes.SHA256())
    )

    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )

    st.download_button(
        "⬇ Download Certificate (.crt)",
        cert_pem,
        file_name="certificate.crt"
    )

    st.download_button(
        "⬇ Download Private Key (.key)",
        key_pem,
        file_name="private.key"
    )

    st.success("✅ Certificate Generated Successfully")
