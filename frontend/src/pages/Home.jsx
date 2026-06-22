import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import "./Home.css";
function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);

    const timer = setInterval(() => {
      start += step;

      if (start >= target) {
        start = target;
        clearInterval(timer);
      }

      setValue(Math.floor(start));
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}
const SERVICES = [
  "Personal Training",
  "Yoga",
  "HIIT Classes",
  "Strength Training",
  "Boxing",
  "CrossFit",
  "Nutrition Coaching",
  "Recovery Lab",
];

const SERVICE_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&auto=format&fit=crop",
    tag: "Most Popular",
    icon: "🏋️‍♂️",
    name: "Personal Training",
    desc: "One-on-one coaching tailored to your body, goals, and schedule. Results guaranteed.",
  },
  {
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop",
    tag: "Mind & Body",
    icon: "🧘",
    name: "Yoga",
    desc: "From Vinyasa flow to restorative yoga — improve flexibility, reduce stress, and find balance.",
  },
  {
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop",
    tag: "High Intensity",
    icon: "🔥",
    name: "HIIT Classes",
    desc: "Burn fat fast with high-energy group training sessions. 30–45 minutes, max results.",
  },
  {
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop",
    tag: null,
    icon: "💪",
    name: "Strength Training",
    desc: "Build raw power on our Olympic platforms with coach-guided programming.",
  },
  {
    img: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&auto=format&fit=crop",
    tag: "Combat",
    icon: "🥊",
    name: "Boxing",
    desc: "Learn technique, build cardio, and release stress in our fully equipped combat zone.",
  },
  {
    img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop",
    tag: null,
    icon: "🥗",
    name: "Nutrition Coaching",
    desc: "Personalized meal plans and ongoing support to fuel your performance and recovery.",
  },
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&auto=format&fit=crop",
];

const PLANS = [
  {
    id: "recruit",
    name: "Recruit",
    price: 39,
    featured: false,
    features: ["Full gym access", "Locker room & showers", "2 group classes/month", "App access", "Off-peak hours only"],
  },
  {
    id: "warrior",
    name: "Warrior",
    price: 79,
    featured: true,
    features: ["24/7 gym access", "Unlimited group classes", "1 PT session/month", "Recovery lab access", "Nutrition check-ins"],
  },
  {
    id: "elite",
    name: "Elite",
    price: 149,
    featured: false,
    features: ["Everything in Warrior", "4 PT sessions/month", "Priority class booking", "Custom program design", "Guest passes (4/mo)"],
  },
];

const initialForm = {
  fname: "",
  lname: "",
  email: "",
  phone: "",
  age: "",
  plan: "",
  goal: "",
  terms: false,
};

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [selectedServices, setSelectedServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

// animated stats
const members = useCountUp(15000);
const classes = useCountUp(48);
const years = useCountUp(12);

const revealRefs = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleService = (svc) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const validate = () => {
    const errs = {};
    if (!form.fname.trim()) errs.fname = "Please enter your first name.";
    if (!form.lname.trim()) errs.lname = "Please enter your last name.";
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Please enter a valid email address.";
    if (!form.phone.trim()) errs.phone = "Please enter a valid phone number.";
    const ageNum = parseInt(form.age, 10);
    if (isNaN(ageNum) || ageNum < 16) errs.age = "Must be 16 or older.";
    if (!form.plan) errs.plan = "Please select a membership plan.";
    if (form.goal.trim().length < 10) errs.goal = "Please tell us your goal (min 10 characters).";
    if (!form.terms) errs.terms = "You must agree to the terms to continue.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await api.post("/signup", {
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: parseInt(form.age, 10),
        plan: form.plan,
        services: selectedServices,
        goal: form.goal.trim(),
      });

      if (res.data.success) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        setForm(initialForm);
        setSelectedServices([]);
        setErrors({});
      }
    } catch (err) {
      const message = err.response?.data?.message || "Submission failed. Please try again.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      <div className="noise-overlay" />

      {/* NAV */}
      <nav className="home-nav">
        <Link to="/" className="logo">ART<span>FIT</span></Link>
        <ul>
          <li><button onClick={() => scrollToId("features")}>Facility</button></li>
          <li><button onClick={() => scrollToId("services")}>Services</button></li>
          <li><button onClick={() => scrollToId("plans")}>Plans</button></li>
          <li><button onClick={() => scrollToId("signup")}>Sign Up</button></li>
        </ul>
        <div className="nav-user">
          {user ? (
            <>
              <span className="nav-user-name">Hi, {user.fname}</span>
              <Link to="/dashboard" className="nav-auth-btn primary">My Dashboard</Link>
              <button onClick={handleLogout} className="nav-auth-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-auth-btn">Login</Link>
              <Link to="/login" className="nav-auth-btn primary">Join Now</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
<section className="hero">
  <div className="hero-bg"></div>

  <div className="hero-tagline">Welcome to ARTFIT</div>

  <div className="hero-content">
    <p className="hero-eyebrow">ARTFIT Gym — Where Champions Train</p>

    <h1>
      FORGE<br />
      YOUR <em>LIMITS</em>
    </h1>

    <p className="hero-sub">
      Elite training, world-class equipment, and coaches who push you past what you
      thought possible. No excuses. Just results.
    </p>

    <div className="hero-actions">
      <button className="btn-primary" onClick={() => scrollToId("signup")}>
        Start Free Trial
      </button>
      <button className="btn-ghost" onClick={() => scrollToId("plans")}>
        View Plans
      </button>
    </div>
  </div>

  {/* HERO STATS (FIXED + CLEAN) */}
  <div className="hero-stats">
    <div className="stat">
      <div className="stat-num">
        {Math.floor(members / 1000)}<span>K</span>
      </div>
      <div className="stat-label">Members</div>
    </div>

    <div className="stat">
      <div className="stat-num">
        {classes}<span>+</span>
      </div>
      <div className="stat-label">Classes/Week</div>
    </div>

    <div className="stat">
      <div className="stat-num">
        {years}<span>+</span>
      </div>
      <div className="stat-label">Years Strong</div>
    </div>
  </div>
</section>
      {/* MARQUEE */}
      <div className="marquee-bar">
        <div className="marquee-track">
          {[...Array(2)].flatMap((_, i) =>
            ["Powerlifting", "CrossFit", "HIIT Classes", "Olympic Lifting", "Yoga", "Personal Training", "Boxing", "Recovery Lounge", "Nutrition Coaching"].map(
              (item, j) => <span className="marquee-item" key={`${i}-${j}`}>{item}</span>
            )
          )}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="reveal">
          <p className="features-label">The Artfit Experience</p>
          <h2>Are you ready to take your fitness to the next level?</h2>
          <p>No mirror jockeys, no watered-down machines. Every inch of our facility is designed for one thing: performance.</p>
        </div>
        <div className="feature-grid reveal">
          <div className="feature-card"><span className="feature-icon">🏋️</span><h3>Olympic Platforms</h3><p>8 dedicated lifting platforms with calibrated plates and full-length bumper sets.</p></div>
          <div className="feature-card"><span className="feature-icon">🥊</span><h3>Combat Zone</h3><p>Full boxing ring, heavy bags, and open mat space for striking & grappling.</p></div>
          <div className="feature-card"><span className="feature-icon">💪</span><h3>Expert Coaches</h3><p>Certified strength & conditioning coaches available for personal training sessions.</p></div>
          <div className="feature-card"><span className="feature-icon">🧊</span><h3>Recovery Lab</h3><p>Ice baths, sauna, compression therapy, and foam rolling suites. 24/7 access.</p></div>
          <div className="feature-card"><span className="feature-icon">📱</span><h3>Smart Tracking</h3><p>App-integrated equipment syncs your workouts, progress, and performance data.</p></div>
          <div className="feature-card"><span className="feature-icon">🏋️‍♂️</span><h3>Personal Trainer</h3><p>One-on-one training sessions with certified personal trainers for maximum results.</p></div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="section-header reveal">
          <p className="label">What We Offer</p>
          <h2>OUR SERVICES</h2>
          <p>From high-intensity classes to mindful movement — we have a service for every goal.</p>
        </div>
        <div className="services-grid reveal">
          {SERVICE_CARDS.map((svc) => (
            <div className="service-card" key={svc.name}>
              <img src={svc.img} alt={svc.name} loading="lazy" />
              <div className="service-overlay">
                {svc.tag && <span className="service-tag">{svc.tag}</span>}
                <span className="service-icon">{svc.icon}</span>
                <div className="service-name">{svc.name}</div>
                <div className="service-desc">{svc.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery" id="gallery">
        <div className="section-header reveal">
          <p className="label">Inside Artfit</p>
          <h2>OUR FACILITY</h2>
        </div>
        <div className="gallery-grid reveal">
          {GALLERY_IMAGES.map((img, i) => (
            <div className="g-item" key={i}>
              <img src={img} alt="Artfit facility" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section className="plans" id="plans">
        <div className="section-header reveal"><p className="label">Membership Plans</p><h2>PICK YOUR WEAPON</h2></div>
        <div className="plans-grid reveal">
          {PLANS.map((plan) => (
            <div className={`plan-card ${plan.featured ? "featured" : ""}`} key={plan.id}>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price"><sup>$</sup>{plan.price}<sub>/mo</sub></div>
              <div className="plan-divider"></div>
              <ul className="plan-features">
                {plan.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button
                className={`plan-btn ${plan.featured ? "plan-btn-white" : "plan-btn-dark"}`}
                onClick={() => {
                  scrollToId("signup");
                  setForm((prev) => ({ ...prev, plan: plan.id }));
                }}
              >
                {plan.id === "elite" ? "Go Elite" : plan.featured ? "Join Now" : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNUP */}
      <section className="signup" id="signup">
        <div className="signup-copy reveal">
          <p className="label">Free 7-Day Trial</p>
          <h2>READY TO START FORGING?</h2>
          <p>No commitment. No credit card. Just show up, train hard, and see what Artfit is about.</p>
          <div className="signup-benefits">
            <div className="benefit"><span className="benefit-dot"></span> Full access to all equipment</div>
            <div className="benefit"><span className="benefit-dot"></span> 3 complimentary group classes</div>
            <div className="benefit"><span className="benefit-dot"></span> One-on-one fitness assessment</div>
            <div className="benefit"><span className="benefit-dot"></span> No cancellation hassle, ever</div>
          </div>
        </div>

        <div className="form-box reveal">
          <div className="form-title">CLAIM YOUR FREE TRIAL</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fname">First Name</label>
                <input type="text" id="fname" placeholder="Val" value={form.fname} onChange={handleChange} className={errors.fname ? "error" : ""} />
                {errors.fname && <span className="error-msg">{errors.fname}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lname">Last Name</label>
                <input type="text" id="lname" placeholder="Atieno" value={form.lname} onChange={handleChange} className={errors.lname ? "error" : ""} />
                {errors.lname && <span className="error-msg">{errors.lname}</span>}
              </div>
              <div className="form-group full">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="you@email.com" value={form.email} onChange={handleChange} className={errors.email ? "error" : ""} />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="+2547 0000 0000" value={form.phone} onChange={handleChange} className={errors.phone ? "error" : ""} />
                {errors.phone && <span className="error-msg">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input type="number" id="age" placeholder="25" min="16" max="99" value={form.age} onChange={handleChange} className={errors.age ? "error" : ""} />
                {errors.age && <span className="error-msg">{errors.age}</span>}
              </div>
              <div className="form-group full">
                <label htmlFor="plan">Interested Plan</label>
                <select id="plan" value={form.plan} onChange={handleChange} className={errors.plan ? "error" : ""}>
                  <option value="">— Select a plan —</option>
                  <option value="recruit">Recruit — $39/mo</option>
                  <option value="warrior">Warrior — $79/mo</option>
                  <option value="elite">Elite — $149/mo</option>
                </select>
                {errors.plan && <span className="error-msg">{errors.plan}</span>}
              </div>

              <div className="form-group full">
                <span className="chips-label">Interested Services (select all that apply)</span>
                <div className="chips-wrap">
                  {SERVICES.map((svc) => (
                    <span
                      key={svc}
                      className={`chip ${selectedServices.includes(svc) ? "selected" : ""}`}
                      onClick={() => toggleService(svc)}
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group full">
                <label htmlFor="goal">Your Primary Goal</label>
                <textarea id="goal" placeholder="e.g. Build muscle, lose weight, train for a competition..." value={form.goal} onChange={handleChange} className={errors.goal ? "error" : ""} />
                {errors.goal && <span className="error-msg">{errors.goal}</span>}
              </div>

              <div className="form-group full form-checkbox-row">
                <input type="checkbox" id="terms" checked={form.terms} onChange={handleChange} />
                <div>
                  <label htmlFor="terms">
                    I agree to the <a href="#">Terms &amp; Conditions</a> and confirm I am 16 years or older.
                  </label>
                  {errors.terms && <span className="error-msg">{errors.terms}</span>}
                </div>
              </div>
            </div>
            <div className="form-submit">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting…" : "Claim Free Trial"}
              </button>
              <p className="form-note">Cancel anytime. No payment info required.</p>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-logo">ARTFIT<span>Gym</span></div>
        <p className="footer-copy">© 2026 ARTFIT Gym. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <Link to="/login">Member Login</Link>
          <a href="#">Contact</a>
        </div>
      </footer>

      <div className={`toast ${showToast ? "show" : ""}`}>✔ Application submitted! We'll be in touch soon.</div>
    </div>
  );
}
