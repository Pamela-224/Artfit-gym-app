from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pymysql
pymysql.install_as_MySQLdb()

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from datetime import datetime
from collections import Counter, defaultdict

app = Flask(__name__)
app.secret_key = "artfit_secret_key_2026"

# =========================
# CONFIG
# =========================
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost:3307/gym_app_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config["JWT_SECRET_KEY"] = "artfit_jwt_secret_2026"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Allow the Vite dev server (and any origin in dev) to call the API.
CORS(app, resources={r"/*": {"origins": "*"}})

# =========================
# MODELS
# =========================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    fname = db.Column(db.String(100))
    lname = db.Column(db.String(100))
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "fname": self.fname,
            "lname": self.lname,
            "is_admin": self.is_admin,
            "created_at": self.created_at,
        }


class Signup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fname = db.Column(db.String(100))
    lname = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20))
    age = db.Column(db.Integer)
    plan = db.Column(db.String(50))
    services = db.Column(db.String(300))
    goal = db.Column(db.Text)
    submitted_at = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "fname": self.fname,
            "lname": self.lname,
            "email": self.email,
            "phone": self.phone,
            "age": self.age,
            "plan": self.plan,
            "services": self.services,
            "goal": self.goal,
            "submitted_at": self.submitted_at,
        }

# =========================
# PASSWORD HELPERS
# =========================
def hash_password(password):
    return bcrypt.generate_password_hash(password).decode("utf-8")


def check_password(password, hashed):
    return bcrypt.check_password_hash(hashed, password)


def get_current_user_id():
    """flask-jwt-extended requires the JWT subject to be a string, so the user id
    is stored as the subject (converted to int here) and any extra info is read
    from additional claims via get_jwt() where needed."""
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None
# =========================
# HOME ROUTE
# =========================
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "ArtFit Gym API is running",
        "version": "1.0"
    })
# =========================
# AUTH
# =========================
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    fname = data.get("fname", "").strip()
    lname = data.get("lname", "").strip()

    if not email or not password or not fname:
        return jsonify({"success": False, "message": "First name, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already exists"}), 409

    user = User(
        email=email,
        fname=fname,
        lname=lname,
        password_hash=hash_password(password),
        created_at=str(datetime.utcnow()),
    )

    db.session.add(user)
    db.session.commit()

    # 🔥 THIS MUST BE INSIDE THE FUNCTION
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "message": "Registered successfully",
        "token": token,
        "user": user.to_dict()
    })

@app.route("/api/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 415

    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password(password, user.password_hash):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "email": user.email,
            "name": user.fname,
            "is_admin": user.is_admin,
        },
    )

    return jsonify({
        "success": True,
        "token": token,
        "user": user.to_dict(),
    })


@app.route("/api/logout", methods=["POST"])
def logout():
    # JWTs are stateless here (no expiry, no blacklist) so logout is purely client-side
    # (the React app just drops the token from localStorage). Endpoint kept for symmetry.
    return jsonify({"success": True, "message": "Logged out"})


@app.route("/api/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    return jsonify({"success": True, "user": user.to_dict()})

# =========================
# SIGNUP (FREE TRIAL FORM)
# =========================
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    fname = (data.get("fname") or "").strip()
    lname = (data.get("lname") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    age = data.get("age")
    plan = (data.get("plan") or "").strip()
    services = data.get("services") or []
    goal = (data.get("goal") or "").strip()

    errors = {}
    if not fname:
        errors["fname"] = "Please enter your first name."
    if not lname:
        errors["lname"] = "Please enter your last name."
    if not email or "@" not in email:
        errors["email"] = "Please enter a valid email address."
    if not phone:
        errors["phone"] = "Please enter a valid phone number."
    try:
        age = int(age)
        if age < 16:
            errors["age"] = "Must be 16 or older."
    except (TypeError, ValueError):
        errors["age"] = "Must be 16 or older."
    if plan not in ("recruit", "warrior", "elite"):
        errors["plan"] = "Please select a membership plan."
    if len(goal) < 10:
        errors["goal"] = "Please tell us your goal (min 10 characters)."

    if errors:
        return jsonify({"success": False, "message": "Please fix the highlighted fields", "errors": errors}), 400

    existing = Signup.query.filter_by(email=email).first()
    services_str = ",".join(services) if isinstance(services, list) else services

    if existing:
        existing.fname = fname
        existing.lname = lname
        existing.phone = phone
        existing.age = age
        existing.plan = plan
        existing.services = services_str
        existing.goal = goal
        existing.submitted_at = str(datetime.utcnow())
    else:
        new_signup = Signup(
            fname=fname,
            lname=lname,
            email=email,
            phone=phone,
            age=age,
            plan=plan,
            services=services_str,
            goal=goal,
            submitted_at=str(datetime.utcnow()),
        )
        db.session.add(new_signup)

    db.session.commit()
    return jsonify({"success": True, "message": "Application submitted! We'll be in touch soon."})

# =========================
# MEMBER DASHBOARD
# =========================
@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    signup_record = Signup.query.filter_by(email=user.email).first()

    return jsonify({
        "success": True,
        "user": user.to_dict(),
        "signup": signup_record.to_dict() if signup_record else None,
    })

@app.route("/api/dashboard/update-profile", methods=["POST"])
@jwt_required()
def update_profile():
    user_id = get_current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    data = request.get_json() or {}
    fname = (data.get("fname") or "").strip()
    lname = (data.get("lname") or "").strip()

    if not fname:
        return jsonify({"success": False, "message": "First name is required."}), 400

    user.fname = fname
    user.lname = lname
    db.session.commit()

    return jsonify({"success": True, "message": "Profile updated successfully!", "user": user.to_dict()})

# =========================
# ADMIN HELPERS
# =========================
def require_admin():
    user_id = get_current_user_id()
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return None
    return user

# =========================
# ADMIN: MEMBERS TABLE
# =========================
@app.route("/api/admin/members", methods=["GET"])
@jwt_required()
def admin_members():
    if not require_admin():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    signups = Signup.query.order_by(Signup.id.desc()).all()
    users = User.query.order_by(User.id.desc()).all()

    return jsonify({
        "success": True,
        "signups": [s.to_dict() for s in signups],
        "users": [u.to_dict() for u in users],
        "total_signups": len(signups),
        "total_users": len(users),
    })


@app.route("/api/admin/delete-signup/<int:signup_id>", methods=["DELETE"])
@jwt_required()
def delete_signup(signup_id):
    if not require_admin():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    record = Signup.query.get(signup_id)
    if not record:
        return jsonify({"success": False, "message": "Signup not found"}), 404

    db.session.delete(record)
    db.session.commit()
    return jsonify({"success": True, "message": "Signup deleted"})


@app.route("/api/admin/delete-user/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    if not require_admin():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    record = User.query.get(user_id)
    if not record:
        return jsonify({"success": False, "message": "User not found"}), 404
    if record.is_admin:
        return jsonify({"success": False, "message": "Cannot delete an admin account"}), 400

    db.session.delete(record)
    db.session.commit()
    return jsonify({"success": True, "message": "User deleted"})

# =========================
# ADMIN: ANALYTICS DASHBOARD
# =========================
@app.route("/api/admin/analytics", methods=["GET"])
@jwt_required()
def admin_analytics():
    if not require_admin():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    signups = Signup.query.all()
    users = User.query.all()

    total_signups = len(signups)
    total_users = len(users)
    elite_count = sum(1 for s in signups if s.plan == "elite")
    warrior_count = sum(1 for s in signups if s.plan == "warrior")
    recruit_count = sum(1 for s in signups if s.plan == "recruit")

    # Signups over time (by date)
    date_counts = defaultdict(int)
    for s in signups:
        if s.submitted_at:
            date_counts[s.submitted_at[:10]] += 1
    signup_dates = sorted(date_counts.keys())
    signup_counts = [date_counts[d] for d in signup_dates]

    # Age buckets
    buckets = {"16-20": 0, "21-25": 0, "26-30": 0, "31-40": 0, "41+": 0}
    for s in signups:
        if s.age is None:
            continue
        if s.age <= 20:
            buckets["16-20"] += 1
        elif s.age <= 25:
            buckets["21-25"] += 1
        elif s.age <= 30:
            buckets["26-30"] += 1
        elif s.age <= 40:
            buckets["31-40"] += 1
        else:
            buckets["41+"] += 1

    # Service popularity
    service_counter = Counter()
    for s in signups:
        if s.services:
            for svc in s.services.split(","):
                svc = svc.strip()
                if svc:
                    service_counter[svc] += 1
    service_counts = dict(service_counter.most_common())
    max_service_count = max(service_counts.values()) if service_counts else 0

    recent_signups = sorted(signups, key=lambda s: s.submitted_at or "", reverse=True)[:8]

    return jsonify({
        "success": True,
        "total_signups": total_signups,
        "total_users": total_users,
        "elite_count": elite_count,
        "warrior_count": warrior_count,
        "recruit_count": recruit_count,
        "signup_dates": signup_dates,
        "signup_counts": signup_counts,
        "age_buckets": buckets,
        "service_counts": service_counts,
        "max_service_count": max_service_count,
        "recent_signups": [s.to_dict() for s in recent_signups],
    })

# =========================
# INIT DB
# =========================
@app.route("/api/init-db")
def init_db():
    db.create_all()

    if not User.query.filter_by(email="admin@artfit.com").first():
        admin = User(
            email="admin@artfit.com",
            fname="Admin",
            lname="User",
            password_hash=hash_password("admin003"),
            is_admin=True,
            created_at=str(datetime.utcnow()),
        )
        db.session.add(admin)
        db.session.commit()

    return jsonify({"success": True, "message": "DB ready"})

# =========================
# RUN
# =========================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000, host="0.0.0.0")
