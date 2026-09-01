import { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import sjmwLogo from '../../assets/sjmw-logo.png';

import { Link, useLocation, useNavigate } from 'react-router-dom';

/* ── Navigation items (Removed per user request) ───────────── */
const NAV_LINKS = [];

/**
 * Navbar Component
 *
 * - Fixed transparent overlay on hero section
 * - Transitions to solid white on scroll (> 80px)
 * - Responsive hamburger menu for mobile
 * - ERP Login CTA button on the right
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState(location.pathname === '/about' ? '/about' : '/#home');
  const lastScrollY = useRef(0);

  /* ── Scroll listener ─────────────────────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 80);

      // Hide/Show logic
      if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Close mobile menu on resize to desktop ──────────────── */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ── Prevent body scroll when mobile menu open ───────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* ── Handle nav link click ───────────────────────────────── */
  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setActiveLink(href);
    setMenuOpen(false);

    if (href.startsWith('/#')) {
      const targetId = href.substring(2);
      if (location.pathname !== '/') {
        navigate(href);
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          // Update URL without reload
          window.history.pushState(null, '', href);
        }
      }
    }
  };

  return (
    <>
      {/* ── Main Navbar ─────────────────────────────────────── */}
      <header
        className={`navbar pill-nav ${scrolled ? 'scrolled' : ''} ${hidden ? 'hidden' : ''}`}
        role="banner"
        aria-label="Main navigation"
      >
        <div className="navbar__inner">

          {/* Brand / Logo */}
          <a className="navbar__brand" href="/#home" aria-label="Sri Jothi Moulding Works – Home">
            <img
              src={sjmwLogo}
              alt="SJMW Logo"
              className="navbar__logo-img"
              width={40}
              height={40}
            />
            <span className="navbar__brand-text">
              <span className="navbar__brand-name">SJMW</span>
              <span className="navbar__brand-tagline">Sri Jothi Moulding Works</span>
            </span>
          </a>

          {/* Vertical Divider */}
          <div className="navbar__divider" />

          {/* Desktop CTA */}
          <div className="navbar__cta">
            <Link
              to="/about"
              className="btn-nav-about"
              aria-label="About Us"
              onClick={() => window.scrollTo(0, 0)}
            >
              About
            </Link>
            <a href="#erp" className="btn-nav-erp" aria-label="ERP Login portal">
              ERP Login
            </a>
          </div>

        </div>
      </header>


    </>
  );
}
