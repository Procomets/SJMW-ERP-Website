import React from 'react';
import './Hero.css';

import ingotImage from '../../assets/ingot-product.png'; // Small ingot for the floating card
import StatsCard from '../StatsCard/StatsCard';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useState, useEffect } from 'react';

const AnimatedNumber = ({ finalValue, trigger }) => {
  const [displayValue, setDisplayValue] = useState(finalValue);

  useEffect(() => {
    if (trigger === 0) return; // Wait for first trigger

    const match = finalValue.match(/^(\d+)(.*)$/);
    if (!match) return;

    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const duration = 1800; // 1.8 seconds
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * target);
      
      setDisplayValue(`${current}${suffix}`);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(finalValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [finalValue, trigger]);

  return <>{displayValue}</>;
};

/* ── Statistics data ───────────────────────────────────────── */
const STATS = [
  { number: '35+',   label: 'Years in Industry',   delay: '0s'   },
  { number: '5000+', label: 'Tons Manufactured',   delay: '0.2s' },
  { number: '150+',  label: 'Industrial Customers',delay: '0.4s' },
  { number: '99%',   label: 'Quality Assurance',   delay: '0.6s' },
];

/**
 * Hero Component
 * Redesigned to match the premium Steevlp aesthetic with a massive 
 * rounded container, floating info card, and a circular overlapping button.
 */
export default function Hero() {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [animTrigger, setAnimTrigger] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setAnimTrigger(prev => prev + 1);
    }
  }, [isVisible]);

  const handleStatsHover = () => {
    setAnimTrigger(prev => prev + 1);
  };

  return (
    <section 
      id="home" 
      className={`hero-section reveal-section ${isVisible ? 'is-visible' : ''}`} 
      aria-labelledby="hero-heading"
      ref={ref}
    >
      <div className="hero__container">
        {/* ── Background Image ─────────────────────────────────── */}
        <div className="hero__bg" aria-hidden="true">
          <video
            src="https://res.cloudinary.com/dmemdpd69/video/upload/v1787413197/SJMW_PRO.mp4"
            className="hero__bg-video"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
          ></video>
        </div>

        {/* ── Overlay ──────────────────────────────────────────── */}
        <div className="hero__overlay" aria-hidden="true" />

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="hero__content">
          
          <div className="hero__left">
            <h1 id="hero-heading" className="hero__heading">
              Precision Aluminium Manufacturing for Modern Industries
            </h1>

            <p className="hero__description">
              For over 35 years, Sri Jothi Moulding Works has been delivering
              high-quality aluminium ingots with advanced manufacturing processes,
              strict quality control, and reliable industrial solutions.
            </p>

            <div className="hero__buttons">
              <a href="#contact" className="btn-hero-primary" aria-label="Get a free quote">
                GET A FREE QUOTE
                <span className="btn-arrow-circle" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Statistics ──────────────────────────────────── */}
      <div className="hero__stats-container" onMouseEnter={handleStatsHover}>
        {STATS.map(({ number, label, delay }, index) => (
          <div className="hero__stat-block" key={label} style={{ animationDelay: delay }}>
            <span className="stat-number">
              <AnimatedNumber finalValue={number} trigger={animTrigger} />
            </span>
            <span className="stat-label">{label}</span>
            {index < STATS.length - 1 && <div className="stat-divider" />}
          </div>
        ))}
      </div>
    </section>
  );
}
