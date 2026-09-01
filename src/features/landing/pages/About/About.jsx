import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './About.css';
import factoryImage from '../../assets/SRI JYOTHI FACT.png'; // Using the real factory image

const MILESTONES = [
  { 
    year: '1988', 
    label: 'Foundation',
    details: [
      'SJMW Established',
      'Aluminium Alloy Manufacturing Begins',
      'Chennai Manufacturing Facility'
    ]
  },
  { 
    year: '2000', 
    label: 'Expansion',
    details: [
      'Production Capacity Increased',
      'New Industrial Customers',
      'Expanded Supply Network'
    ]
  },
  { 
    year: '2012', 
    label: 'Modernization',
    details: [
      'Advanced Furnace Technology',
      'Better Quality Control',
      'Improved Manufacturing Efficiency'
    ]
  },
  { 
    year: '2025', 
    label: 'Sustainability',
    details: [
      'Eco-friendly Manufacturing',
      'Better Energy Utilization',
      'Responsible Material Recycling'
    ]
  },
  { 
    year: 'Today', 
    label: 'Industry Leader',
    details: [
      '36+ Years of Manufacturing',
      'Premium Aluminium Alloy Ingots',
      'Trusted by 150+ Industrial Customers'
    ]
  }
];

export default function About() {
  const timelineRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeMilestones, setActiveMilestones] = useState([false, false, false, false, false]);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Timeline Animation Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true); // Ensure it only runs once

          // Progress animation sequence (1.8s total duration)
          const totalDuration = 1800; // ms
          const numMilestones = 5;
          const stepDuration = totalDuration / (numMilestones - 1); // 450ms per step

          // Animate the progress bar width over 1.8s
          setProgress(100);

          // Activate milestones sequentially
          for (let i = 0; i < numMilestones; i++) {
            setTimeout(() => {
              setActiveMilestones(prev => {
                const newState = [...prev];
                newState[i] = true;
                return newState;
              });

            }, i * stepDuration);
          }
        }
      },
      { threshold: 0.3 } // Trigger when 30% of timeline is visible
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => {
      if (timelineRef.current) observer.unobserve(timelineRef.current);
    };
  }, [hasAnimated]);

  return (
    <div className="about-page">
      <Navbar />

      {/* Background Elements */}
      <div className="about-bg-grid" aria-hidden="true"></div>

      <div className="about__content">
        
        {/* ── Section 1: Hero Banner ──────────────────────────────── */}
        <section className="about-hero" aria-labelledby="about-hero-heading">
          <div className="about-hero__inner">
            <h1 id="about-hero-heading" className="about-hero__title">
              Our Legacy of <span className="about-hero__title-highlight">Aluminium Excellence</span>
            </h1>
            <p className="about-hero__desc">
              For more than 36 years, Sri Jothi Moulding Works has been manufacturing premium aluminium alloy ingots, setting the benchmark for industrial quality, structural integrity, and technical excellence. Our commitment to precision engineering and consistent quality has made us a trusted partner for industries across India.
            </p>
          </div>
        </section>

        {/* ── Section 2: Company Overview ─────────────────────────── */}
        <section className="about-overview" aria-labelledby="about-overview-heading">
          
          <div className="about-overview__left">
            <h2 id="about-overview-heading" className="about-overview__title">
              Manufacturing Excellence Since 1988
            </h2>
            <p className="about-overview__text">
              Established with a vision to redefine industrial standards, Sri Jothi Moulding Works has grown into a trusted aluminium alloy manufacturer known for quality, reliability, and precision. Over the past three decades, SJMW has continuously invested in advanced manufacturing technologies, stringent quality control systems, and long-term customer relationships. Today, our premium aluminium alloy ingots support automotive, engineering, foundry, electrical, and industrial applications across the country.
            </p>
            
            <div className="about-overview__grid">
              <div className="about-card">
                <span className="about-card__icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>
                </span>
                <h3 className="about-card__title">36+ Years of Excellence</h3>
                <p className="about-card__subtitle">Manufacturing Experience</p>
              </div>
              <div className="about-card">
                <span className="about-card__icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </span>
                <h3 className="about-card__title">Premium Alloy Manufacturing</h3>
                <p className="about-card__subtitle">Industrial Grade Aluminium Ingots</p>
              </div>
              <div className="about-card">
                <span className="about-card__icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <h3 className="about-card__title">Strict Quality Assurance</h3>
                <p className="about-card__subtitle">Every Batch Thoroughly Tested</p>
              </div>
              <div className="about-card">
                <span className="about-card__icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
                <h3 className="about-card__title">Trusted Industrial Partner</h3>
                <p className="about-card__subtitle">Serving Manufacturers Across India</p>
              </div>
            </div>
          </div>

          <div className="about-overview__right">
            <img 
              src={factoryImage} 
              alt="Sri Jothi Moulding Works facility" 
              className="about-overview__image"
            />
          </div>
          
        </section>

        {/* ── Section 3: Manufacturing Journey ────────────────────── */}
        <section className="about-journey" aria-labelledby="about-journey-heading">
          <div className="about-journey__header">
            <h2 id="about-journey-heading" className="about-journey__title">Our Manufacturing Journey</h2>
            <p className="about-journey__subtitle">
              A legacy forged through precision, innovation, and continuous growth.
            </p>
          </div>

          <div className="about-timeline" ref={timelineRef}>
            
            {/* The Background Track */}
            <div className="about-timeline__track"></div>
            
            {/* The Animated Orange Progress Line */}
            <div 
              className="about-timeline__progress" 
              style={{ '--progress': `${progress}%` }}
            ></div>

            {/* Timeline Milestones */}
            {MILESTONES.map((milestone, index) => (
              <div 
                key={index} 
                className={`about-timeline__item ${activeMilestones[index] ? 'active' : ''} ${hoveredIndex === index ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setHoveredIndex(hoveredIndex === index ? null : index);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={hoveredIndex === index}
              >
                <div className="about-timeline__dot"></div>
                <div className="about-timeline__content">
                  <div className="about-timeline__year">{milestone.year}</div>
                  <div className="about-timeline__label">{milestone.label}</div>
                </div>

                {/* Floating Information Card */}
                <div className={`about-timeline__floating-card ${hoveredIndex === index ? 'visible' : ''}`}>
                  <div className="about-timeline__floating-title">{milestone.year}</div>
                  <ul className="about-timeline__floating-list">
                    {milestone.details.map((detail, idx) => (
                      <li key={idx}>✓ {detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

          </div>
        </section>

      </div>
    </div>
  );
}
