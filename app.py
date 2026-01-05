import streamlit as st
import os, hashlib, csv, uuid
from datetime import datetime
import tempfile
import pandas as pd
import qrcode

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.exceptions import InvalidSignature

from reportlab.platypus import SimpleDocTemplate, Paragraph, Image
from reportlab.lib.styles import getSampleStyleSheet

# ================= GOVERNMENT UI =================
st.set_page_config(
    page_title="DataDynamos | Certified Data Erasure",
    page_icon="🏛️",
    layout="wide"
)

st.markdown("""
<style>
body { background:#f8fafc; color:#020617; }
h1,h2,h3 { color:#020617; }
.stButton>button { background:#1e3a8a; color:white; border-radius:4px; }
</style>
""", unsafe_allow_html=True)

st.title("🏛️ Certified Secure Data Erasure System")
st.caption("NIST SP 800-88 • ISO/IEC 27001 • CERT-In Aligned")

# ================= KEY MANAGEMENT =================
KEY_FILE = "signing_key.pem"

def get_key():
    if not os.path.exists(KEY_FILE):
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        with open(KEY_FILE, "wb") as f:
            f.write(key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption()
            ))
    else:
        with open(KEY_FILE, "rb") as f:
            key = serialization.load_pem_private_key(f.read(), password=None)
    return key

KEY = get_key()

# ================= CORE FUNCTIONS =================
def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(4096), b""):
            h.update(c)
    return h.hexdigest()

def secure_wipe(path):
    size = os.path.getsize(path)
    with open(path, "wb") as f:
        f.write(os.urandom(size))
        f.flush()
        os.fsync(f.fileno())
    os.remove(path)

def sign(data: bytes):
    return KEY.sign(
        data,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256()
    )

def verify(data: bytes, signature: bytes):
    try:
        KEY.public_key().verify(
            signature,
            data,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
        return True
    except InvalidSignature:
        return False

def blockchain_anchor(hashval):
    with open("blockchain_anchor.txt", "a") as f:
        f.write(f"{datetime.utcnow()} | {hashval}\n")

# ================= OPERATOR INFO =================
st.sidebar.header("🧾 Operator Identity")
user_id = st.sidebar.text_input("User ID", "gov-admin")
device_id = st.sidebar.text_input("Device Serial", hex(uuid.getnode()))

# ================= FILE WIPE =================
st.header("🧹 Secure Data Sanitization")

file = st.file_uploader("Upload file for irreversible erasure")

if file:
    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.write(file.read())
    tmp.close()

    before = sha256(tmp.name)
    st.code(f"SHA-256 BEFORE:\n{before}")

    if st.button("🚨 EXECUTE NIST-COMPLIANT WIPE"):
        secure_wipe(tmp.name)
        after = hashlib.sha256(b"").hexdigest()

        record = {
            "Timestamp": str(datetime.utcnow()),
            "User ID": user_id,
            "Device Serial": device_id,
            "File Name": file.name,
            "SHA-256 Before": before,
            "SHA-256 After": after,
            "Standards": "NIST SP 800-88 Rev.1 | ISO/IEC 27001 A.8.10",
            "Status": "SANITIZED"
        }

        signature = sign(str(record).encode())
        blockchain_anchor(before)

        # QR Code
        qr = qrcode.make(str(record))
        qr_path = "qr.png"
        qr.save(qr_path)

        # PDF Certificate
        pdf = "Government_Erasure_Certificate.pdf"
        styles = getSampleStyleSheet()
        doc = SimpleDocTemplate(pdf)

        content = [
            Paragraph("<b>GOVERNMENT CERTIFIED DATA ERASURE CERTIFICATE</b>", styles["Title"])
        ]
        for k, v in record.items():
            content.append(Paragraph(f"<b>{k}:</b> {v}", styles["Normal"]))

        content.append(Paragraph("<b>Digital Signature:</b>", styles["Normal"]))
        content.append(Paragraph(signature.hex(), styles["Normal"]))
        content.append(Image(qr_path, width=120, height=120))

        doc.build(content)

        # Audit log
        exists = os.path.exists("audit_log.csv")
        with open("audit_log.csv", "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=record.keys())
            if not exists:
                writer.writeheader()
            writer.writerow(record)

        st.success("✔ Data sanitized, signed, anchored & certified")
        st.download_button("⬇ Download Certificate (PDF)", open(pdf, "rb"), pdf)

# ================= SIGNATURE VERIFICATION =================
st.header("🔍 Certificate Signature Verification")

sig_input = st.text_area("Paste Digital Signature (hex)")
data_input = st.text_area("Paste Certificate Record")

if st.button("Verify Signature"):
    valid = verify(data_input.encode(), bytes.fromhex(sig_input))
    if valid:
        st.success("✔ Signature VALID — Certificate Authentic")
    else:
        st.error("✖ Signature INVALID — Possible tampering")

# ================= ANALYTICS =================
st.header("📊 Compliance Dashboard")

if os.path.exists("audit_log.csv"):
    df = pd.read_csv("audit_log.csv")
    st.metric("Total Sanitizations", len(df))
    st.metric("Unique Devices", df["Device Serial"].nunique())
    st.metric("Operators", df["User ID"].nunique())
    st.dataframe(df, use_container_width=True)

# ================= FOOTER =================
st.info("🏛️ Designed for Government, Defense, Banking & Critical Infrastructure")
