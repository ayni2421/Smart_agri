import React, { useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check,
  CircleHelp, Clock3, Database, Leaf, Menu, PackageCheck,
  Search, ShieldCheck, Sprout, Truck, Users, Wheat, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

// ── Static data ───────────────────────────────────────────────────────────────

const prices = [
  { crop: "Teff",  type: "White teff · quintal",   price: "ETB 8,450", change: "+2.4%", up: true,  mark: "T", tone: "sand"  },
  { crop: "Wheat", type: "Bread wheat · quintal",   price: "ETB 5,200", change: "+1.1%", up: true,  mark: "W", tone: "gold"  },
  { crop: "Maize", type: "White maize · quintal",   price: "ETB 3,650", change: "−0.8%", up: false, mark: "M", tone: "green" },
];

const features = [
  { icon: BarChart3,    title: "Market price intelligence",    text: "Organize market observations and compare commodity prices across selected Ethiopian markets." },
  { icon: Search,       title: "Transparent supplier ranking", text: "Rank eligible suppliers using documented criteria: price, available quantity, location, and delivery history." },
  { icon: PackageCheck, title: "End-to-end traceability",      text: "Follow orders, inventory batches, and deliveries with a clear record of each step in the supply chain." },
  { icon: ShieldCheck,  title: "Accountable data",             text: "Role-based access, anomaly-detection review workflows, and full audit trails support trustworthy records." },
];

const steps = [
  { number: "01", title: "Collect",    text: "Farmers and agents record market prices, available quantities, and supply information." },
  { number: "02", title: "Understand", text: "Compare market observations and identify supply-demand signals across commodities." },
  { number: "03", title: "Coordinate", text: "Discover suppliers, manage procurement orders, and track fulfillment through delivery." },
];

// ── Brand component ───────────────────────────────────────────────────────────

function Brand({ footer = false }) {
  return (
    <Link className={footer ? "brand brand-footer" : "brand"} to="/" aria-label="AgriMarket home">
      <span className="brand-icon"><Sprout size={footer ? 22 : 23} strokeWidth={2.4} /></span>
      <span>
        AgriMarket<span className="brand-light">.</span>
        <small>AGRICULTURAL INTELLIGENCE</small>
      </span>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail]       = useState("");
  const [notice, setNotice]     = useState("");

  const closeMenu = () => setMenuOpen(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setNotice("This is a demo form — it does not send or store your email.");
  }

  return (
    <div className="site-shell">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="topbar">
        <Brand />

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav nav-open" : "nav"}>
          <a href="#platform"     onClick={closeMenu}>Platform</a>
          <a href="#markets"      onClick={closeMenu}>Market snapshot</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="#about"        onClick={closeMenu}>About</a>
        </nav>

        <Link className="nav-cta" to="/register">
          Get started <ArrowRight size={16} />
        </Link>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="hero" id="home">
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" />
              BUILT FOR ETHIOPIAN AGRICULTURE
            </div>

            <h1>Better market insight.<br /><em>Stronger harvests.</em></h1>

            <p className="hero-lead">
              Connect agricultural market data, supplier discovery, and supply-chain
              coordination in one clear platform — built around accountability and
              traceable records.
            </p>

            <div className="hero-actions">
              <Link className="button button-primary" to="/register">
                Explore the platform <ArrowRight size={17} />
              </Link>
              <a className="button button-quiet" href="#how-it-works">
                <span className="play-icon">↗</span> See how it works
              </a>
            </div>

            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>F</span><span>A</span><span>B</span><span>+</span>
              </div>
              <div>
                <strong>Built around real supply-chain roles</strong>
                <small>Farmers · Agents · Buyers · Transporters</small>
              </div>
            </div>
          </div>

          {/* ── Mock dashboard visual ──────────────────────────────────── */}
          <div className="hero-visual" aria-label="Illustrative market intelligence dashboard">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />

            <div className="visual-label">
              <span className="live-dot" /> MARKET OVERVIEW
              <span className="label-date">DEMO DATA</span>
            </div>

            <div className="dashboard-card">
              <div className="dash-top">
                <div>
                  <span className="dash-kicker">COMMODITY PRICE INDEX</span>
                  <h3>Market pulse</h3>
                </div>
                <span className="period-pill">Illustrative</span>
              </div>

              <div className="chart-summary">
                <div>
                  <strong>ETB 5,760</strong>
                  <span>Average sample price / qq</span>
                </div>
                <span className="trend-pill"><ArrowUpRight size={15} /> 3.2%</span>
              </div>

              <div className="chart-wrap">
                <div className="chart-ylabels">
                  <span>6.5k</span><span>6.0k</span><span>5.5k</span><span>5.0k</span>
                </div>
                <svg className="chart" viewBox="0 0 440 150" role="img"
                  aria-label="Illustrative upward price trend — not real market data">
                  <defs>
                    <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%"   stopColor="#6bc38a" stopOpacity=".28" />
                      <stop offset="100%" stopColor="#6bc38a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[18, 55, 92, 129].map(y =>
                    <line key={y} x1="0" y1={y} x2="440" y2={y} className="grid-line" />
                  )}
                  <path d="M0,115 C25,108 33,89 60,96 S93,112 120,83 S160,92 185,66 S221,78 250,57 S288,71 315,42 S355,61 382,30 S414,43 440,15 L440,145 L0,145 Z"
                    fill="url(#areaFill)" />
                  <path d="M0,115 C25,108 33,89 60,96 S93,112 120,83 S160,92 185,66 S221,78 250,57 S288,71 315,42 S355,61 382,30 S414,43 440,15"
                    fill="none" stroke="#72c891" strokeWidth="3.2" strokeLinecap="round" />
                  <circle cx="315" cy="42" r="5" fill="#123b2a" stroke="#a7edb9" strokeWidth="3" />
                </svg>
              </div>
              <div className="chart-xlabels">
                <span>WEEK 1</span><span>WEEK 2</span><span>WEEK 3</span><span>WEEK 4</span>
              </div>

              <div className="dash-bottom">
                <div className="mini-metric">
                  <span className="metric-icon"><Wheat size={16} /></span>
                  <span><small>Commodities</small><strong>3 tracked</strong></span>
                </div>
                <div className="mini-metric">
                  <span className="metric-icon metric-icon-blue"><Database size={16} /></span>
                  <span><small>Observation type</small><strong>Demo records</strong></span>
                </div>
              </div>
            </div>

            <div className="floating-card floating-top">
              <span className="float-icon"><ShieldCheck size={17} /></span>
              <span><strong>Traceable records</strong><small>Role-based activity log</small></span>
              <Check size={16} className="float-check" />
            </div>

            <div className="floating-card floating-bottom">
              <span className="float-icon float-icon-gold"><Truck size={17} /></span>
              <span><strong>Supply chain status</strong><small>Orders · Inventory · Delivery</small></span>
            </div>

            <div className="visual-footnote">
              <span className="footnote-dot" />
              Illustrative interface — sample values are not live market prices.
            </div>
          </div>

          <div className="hero-bottomline">
            <span>MARKET DATA</span><i /><span>SUPPLIER INTELLIGENCE</span><i /><span>TRACEABLE TRANSACTIONS</span>
          </div>
        </section>

        {/* ── Market strip ──────────────────────────────────────────────── */}
        <section className="market-strip" id="markets">
          <div className="section-mini-heading">
            <span className="overline">MARKET SNAPSHOT</span>
            <span className="sample-tag">SAMPLE VALUES · NOT LIVE DATA</span>
          </div>

          <div className="price-grid">
            {prices.map((item) => (
              <article className="price-card" key={item.crop}>
                <div className={`crop-mark ${item.tone}`}>{item.mark}</div>
                <div className="price-info">
                  <h3>{item.crop}</h3>
                  <p>{item.type}</p>
                </div>
                <div className="price-number">
                  <strong>{item.price}</strong>
                  <span className={item.up ? "price-change up" : "price-change down"}>
                    {item.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {item.change}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <p className="data-note">
            <CircleHelp size={14} />
            Values shown are illustrative examples, not verified or current Ethiopian market prices.
            Sign in to view observed market data.
          </p>
        </section>

        {/* ── Platform features ──────────────────────────────────────────── */}
        <section className="section platform-section" id="platform">
          <div className="section-heading">
            <span className="overline">ONE CONNECTED PLATFORM</span>
            <h2>From scattered information<br />to <em>clearer decisions.</em></h2>
            <p>
              Bring essential market and operational records together so the people
              moving agricultural products can act on better information.
            </p>
          </div>

          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }, index) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon"><Icon size={22} /></div>
                <span className="feature-index">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to="/register" className="text-link">
                  Explore feature <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="workflow-section" id="how-it-works">
          <div className="workflow-inner">
            <div className="workflow-intro">
              <span className="overline overline-light">A PRACTICAL WORKFLOW</span>
              <h2>Information that moves<br /><em>with the harvest.</em></h2>
              <p>
                Designed to support both direct digital access and agent-mediated
                data entry, with clear records across the supply chain.
              </p>
              <Link className="button button-light" to="/register">
                Get started <ArrowRight size={17} />
              </Link>
            </div>

            <div className="steps">
              {steps.map((step, index) => (
                <div className="step" key={step.number}>
                  <div className="step-number">{step.number}</div>
                  <div className="step-copy">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                  {index < steps.length - 1 && <div className="step-connector" />}
                </div>
              ))}
            </div>

            <div className="workflow-decoration" aria-hidden="true">
              <Leaf size={200} strokeWidth={0.55} />
            </div>
          </div>
        </section>

        {/* ── Principles / About ──────────────────────────────────────────── */}
        <section className="section principles-section" id="about">
          <div className="principles-copy">
            <span className="overline">BUILT WITH ACCOUNTABILITY</span>
            <h2>Useful intelligence.<br /><em>Transparent foundations.</em></h2>
            <p>
              Market decisions are only as good as the information behind them.
              AgriMarket is designed around clear data sources, consistent measurement
              units, controlled access, and reviewable activity.
            </p>

            <div className="principle-list">
              <div>
                <span><Check size={15} /></span>
                <p>
                  <strong>Clear data provenance</strong>
                  <small>Distinguish verified observations from synthetic test records (BR-03).</small>
                </p>
              </div>
              <div>
                <span><Check size={15} /></span>
                <p>
                  <strong>Consistent measurements</strong>
                  <small>Prices stored in kg; display in quintal or tonne with full conversion history.</small>
                </p>
              </div>
              <div>
                <span><Check size={15} /></span>
                <p>
                  <strong>Human-reviewed decisions</strong>
                  <small>Transparent supplier ranking rules and anomaly-detection review workflows.</small>
                </p>
              </div>
            </div>
          </div>

          <div className="principle-visual" aria-hidden="true">
            <div className="ring ring-outer" />
            <div className="ring ring-inner" />
            <div className="center-leaf"><Sprout size={48} /></div>
            <div className="orbit-chip chip-one"><Database size={16} /><span>Data integrity</span></div>
            <div className="orbit-chip chip-two"><Users size={16} /><span>Role-based access</span></div>
            <div className="orbit-chip chip-three"><ShieldCheck size={16} /><span>Auditability</span></div>
            <div className="principle-caption">TRUST STARTS WITH THE DATA</div>
          </div>
        </section>

        {/* ── CTA / Contact ──────────────────────────────────────────────── */}
        <section className="contact-section" id="contact">
          <div className="contact-card">
            <div className="contact-copy">
              <span className="overline overline-light">THE NEXT STEP</span>
              <h2>Make every market signal<br /><em>more meaningful.</em></h2>
              <p>
                Buyers and farmers can register directly. Agents, transporters,
                and data reviewers are set up by an administrator.
              </p>

              <div className="contact-cta-group">
                <Link className="button button-leaf" to="/register">
                  Create account <ArrowRight size={17} />
                </Link>
                <Link className="button button-outline-light" to="/login">
                  Sign in
                </Link>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label htmlFor="notify-email">Stay updated on the project</label>
              <div className="email-row">
                <input
                  id="notify-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setNotice(""); }}
                  placeholder="Enter your email address"
                  required
                />
                <button type="submit" aria-label="Subscribe">
                  <ArrowRight size={19} />
                </button>
              </div>
              <small>Demo form only — does not send or store your email.</small>
              {notice && <p className="form-notice" role="status">{notice}</p>}
            </form>

            <div className="contact-sun" aria-hidden="true" />
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="footer">
        <Brand footer />
        <p>Smarter agricultural markets through better information.</p>
        <div className="footer-right">
          <span>DEBRE MARKOS UNIVERSITY · ACADEMIC PROJECT</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>

    </div>
  );
}
