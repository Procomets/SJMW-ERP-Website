import { useLocation, useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';

import './Footer.css';

export default function Footer() {
  const { ref, isVisible } = useScrollReveal(0.1);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const [path, query] = href.split('?');
    if (path.startsWith('/#')) {
      const targetId = path.substring(2);
      if (location.pathname !== '/') {
        navigate(href);
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', href);
          // Manually trigger a popstate event so the Products component detects the URL change
          window.dispatchEvent(new Event('popstate'));
        } else {
          navigate(href);
        }
      }
    } else {
      navigate(href);
    }
  };

  return (
    <footer className={`footer ${isVisible ? 'is-visible' : ''}`} ref={ref}>
      <div className="footer__inner">
        <div className="footer__grid">
          
          {/* Column 1: Brand */}
          <div className="footer__column footer__brand-col">
            <h2 className="footer__brand-title">SJMW</h2>
            <p className="footer__brand-desc">
              For more than 35 years, Sri Jothi Moulding Works has been manufacturing premium aluminium alloy ingots trusted by industries across India.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer__column">
            <h3 className="footer__title">Quick link</h3>
            <ul className="footer__list">
              <li><a href="/#home" onClick={(e) => handleLinkClick(e, '/#home')} className="footer__link">Home</a></li>
              <li><a href="/about" onClick={(e) => handleLinkClick(e, '/about')} className="footer__link">About us</a></li>
              <li><a href="/#manufacturing" onClick={(e) => handleLinkClick(e, '/#manufacturing')} className="footer__link">Manufacturing</a></li>
              <li><a href="/#contact" onClick={(e) => handleLinkClick(e, '/#contact')} className="footer__link">Contact us</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="footer__column">
            <h3 className="footer__title">Company</h3>
            <ul className="footer__list">
              <li><a href="/#products" onClick={(e) => handleLinkClick(e, '/#products')} className="footer__link">Products</a></li>
              <li><a href="/#quality" onClick={(e) => handleLinkClick(e, '/#quality')} className="footer__link">Quality</a></li>
              <li><a href="/#testimonials" onClick={(e) => handleLinkClick(e, '/#testimonials')} className="footer__link">Testimonials</a></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="footer__column">
            <h3 className="footer__title">Contact</h3>
            <ul className="footer__list">
              <li><a href="tel:+919551798698" className="footer__link">+91 95517 98698</a></li>
              <li><a href="mailto:info@sjmw.in" className="footer__link">info@sjmw.in</a></li>
              <li>
                <span className="footer__link" style={{ cursor: 'default', pointerEvents: 'none', lineHeight: '1.5', display: 'inline-block', marginTop: '4px' }}>
                  Chennai, Tamil Nadu,<br />
                  India
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="footer__bottom">
          <div className="footer__copyright">
            ©2026 Sri Jothi Moulding Works All rights reserved.
          </div>
          <div className="footer__credits">
            Design by <a href="https://www.procomets.com" target="_blank" rel="noopener noreferrer">Procomets Solutions</a>
          </div>
        </div>
      </div>

      {/* Background Watermark moved to bottom of container */}
      <div className="footer__watermark" aria-hidden="true">
        SJMW
      </div>
    </footer>
  );
}
