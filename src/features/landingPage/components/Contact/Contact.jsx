import React from 'react';
import { Link } from 'react-router-dom';
import './Contact.css';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import sjmwLogo from '../../assets/sjmw-logo.png';

export default function Contact() {
  const { ref, isVisible } = useScrollReveal(0.15);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would handle form submission here
    console.log("Enquiry form submitted");
  };

  return (
    <section 
      id="contact" 
      className={`sjmw-contact reveal-section ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
      aria-labelledby="contact-heading"
    >
      {/* Subtle Technical Grid Background */}
      <div className="sjmw-contact__bg-grid" aria-hidden="true" />
      
      {/* Large Subtle Watermark */}
      <div className="sjmw-contact__watermark" aria-hidden="true">
        SJMW
      </div>

      <div className="sjmw-contact__container">
        
        {/* 4-Column Grid */}
        <div className="sjmw-contact__grid">
          
          {/* Column 1: Company Info */}
          <div className="sjmw-contact__col sjmw-contact__col--company animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="sjmw-contact__brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <img src={sjmwLogo} alt="SJMW Logo" width={40} height={40} />
                <span className="sjmw-contact__logo-text">SJMW</span>
              </div>
              <h3 className="sjmw-contact__company-name">Sri Jothi Moulding Works</h3>
            </div>
            
            <p className="sjmw-contact__company-desc">
              Whether you require premium aluminium alloy ingots, customized alloy solutions, or long-term manufacturing support, our experienced team is ready to assist.
            </p>
            
            <div className="sjmw-contact__details">
              <div className="sjmw-contact__detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Chennai, Tamil Nadu</span>
              </div>
              <div className="sjmw-contact__detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <a href="tel:+919551798698">+91 95517 98698</a>
              </div>

              <div className="sjmw-contact__detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Monday – Saturday<br/>9:00 AM – 6:00 PM</span>
              </div>
            </div>

            <div className="sjmw-contact__socials">
              <a href="#" className="sjmw-social-btn" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" className="sjmw-social-btn" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
              <a href="#" className="sjmw-social-btn" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Contact Form */}
          <div className="sjmw-contact__col sjmw-contact__col--form animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <div className="sjmw-contact__form-wrapper">
              <h4 className="sjmw-contact__col-title">Contact Us</h4>
              <p className="sjmw-contact__form-subtitle">
                Tell us about your aluminium alloy requirements and our team will get back to you.
              </p>
              
              <form className="sjmw-contact__form" onSubmit={handleSubmit}>
                <div className="sjmw-form-group">
                  <input type="text" id="fullName" name="fullName" className="sjmw-input" placeholder="Full Name" required />
                </div>
                
                <div className="sjmw-form-group">
                  <input type="tel" id="phone" name="phone" className="sjmw-input" placeholder="Phone Number" required />
                </div>

                <div className="sjmw-form-group">
                  <input type="text" id="subject" name="subject" className="sjmw-input" placeholder="Subject" required />
                </div>

                <div className="sjmw-form-group">
                  <textarea id="message" name="message" className="sjmw-textarea" placeholder="Message" required></textarea>
                </div>

                <button type="submit" className="sjmw-submit-btn">
                  Send Enquiry <span className="sjmw-submit-arrow" aria-hidden="true">→</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
