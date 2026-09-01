import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Products.css';
import ingotImg from '../../assets/premium_aluminium_ingot_stack.png';
import { useScrollReveal } from '../../hooks/useScrollReveal';

// TargetY is the exact Y position for the dot on the ingot.
// TargetX is the horizontal position of the dot on the ingot (relative to full container width).
const ALLOY_DATA = [
  {
    id: 'lm6',
    category: 'MARINE GRADE',
    name: 'LM6',
    desc: 'Excellent corrosion resistance',
    app: 'Marine Components',
    properties: ['High Fluidity', 'Corrosion Resistant', 'Good Weldability'],
    targetX: '42', targetY: '38', side: 'left'
  },
  {
    id: 'adc12',
    category: 'DIE CAST',
    name: 'ADC12',
    desc: 'High Pressure Die Casting',
    app: 'Gear Housings',
    properties: ['Excellent Flow', 'Good Thermal Conductivity', 'High Production Rate'],
    targetX: '38', targetY: '48', side: 'left'
  },
  {
    id: 'lm24',
    category: 'ENGINEERING',
    name: 'LM24',
    desc: 'Excellent machinability',
    app: 'Industrial Components',
    properties: ['High Yield Strength', 'Excellent Castability', 'Good Machinability'],
    targetX: '34', targetY: '58', side: 'left'
  },
  {
    id: 'a356',
    category: 'PREMIUM',
    name: 'A356',
    desc: 'Heat Treatable Alloy',
    app: 'Automotive Wheels',
    properties: ['Exceptional Elongation', 'High Tensile Strength', 'Excellent Weldability'],
    targetX: '63', targetY: '38', side: 'right'
  },
  {
    id: 'lm25',
    category: 'MARINE GRADE',
    name: 'LM25',
    desc: 'High Strength',
    app: 'Marine Engineering',
    properties: ['High Strength', 'Excellent Corrosion Resistance', 'Heat Treatable'],
    targetX: '68', targetY: '48', side: 'right'
  },
  {
    id: 'ac4b',
    category: 'AUTOMOTIVE',
    name: 'AC4B',
    desc: 'General Engineering Alloy',
    app: 'Precision Castings',
    properties: ['Good Castability', 'High Hardness', 'Wear Resistance'],
    targetX: '73', targetY: '58', side: 'right'
  }
];

const LEFT_ALLOYS  = ALLOY_DATA.filter(a => a.side === 'left');
const RIGHT_ALLOYS = ALLOY_DATA.filter(a => a.side === 'right');

export default function Products() {
  const [hoveredAlloy, setHoveredAlloy] = useState(null);
  const { ref, isVisible } = useScrollReveal();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const labelRefs = useRef([]);
  const [lineCoords, setLineCoords] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateLineCoords = () => {
    if (!containerRef.current || isMobile) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newCoords = ALLOY_DATA.map((alloy, index) => {
      const label = labelRefs.current[index];
      if (!label) return null;
      const labelRect = label.getBoundingClientRect();

      let startX, startY;
      if (alloy.side === 'right') {
        // For right-side labels: line starts from LEFT edge, goes left to dot
        startX = ((labelRect.left - containerRect.left) / containerRect.width) * 100;
      } else {
        // For left-side labels: line starts from RIGHT edge, goes right to dot
        startX = ((labelRect.right - containerRect.left) / containerRect.width) * 100;
      }
      startY = ((labelRect.top + labelRect.height / 2 - containerRect.top) / containerRect.height) * 100;

      return { startX, startY };
    });
    setLineCoords(newCoords);
  };

  useEffect(() => {
    if (isVisible) {
      // First pass — some refs (especially right-side labels) may not be mounted yet
      updateLineCoords();
      // Use rAF to guarantee refs are populated after the browser paints
      const raf = requestAnimationFrame(() => updateLineCoords());
      // Extra safety pass after animations settle
      const timeout  = setTimeout(updateLineCoords, 700);
      const timeout2 = setTimeout(updateLineCoords, 1400);
      window.addEventListener('resize', updateLineCoords);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timeout);
        clearTimeout(timeout2);
        window.removeEventListener('resize', updateLineCoords);
      };
    }
  }, [isVisible, isMobile]);

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const { left, top, width, height } = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    sectionRef.current.style.setProperty('--mouse-x', x);
    sectionRef.current.style.setProperty('--mouse-y', y);
  };

  // SVG straight line generator — matches the reference image style
  const generatePath = (x1, y1, x2, y2) => {
    if (!x1 || !y1) return ''; // wait for dynamic calculation
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  return (
    <section 
      id="products" 
      className={`products-blueprint premium-showcase reveal-section ${isVisible ? 'is-visible' : ''}`}
      ref={(node) => {
        ref.current = node;
        sectionRef.current = node;
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (sectionRef.current) {
          sectionRef.current.style.setProperty('--mouse-x', 0);
          sectionRef.current.style.setProperty('--mouse-y', 0);
        }
      }}
    >
      {/* Section Header — centered above the showcase */}
      <div className={`products-section-header ${isVisible ? 'is-visible' : ''}`}>
        <h2 className="products-section-heading animate-fade-up">Our Products</h2>
        <p className="products-section-subtitle animate-fade-up" style={{ animationDelay: '0.15s' }}>
          Premium aluminium alloy ingots engineered for consistent quality, reliable performance, and demanding industrial applications.
        </p>
      </div>

      <div className="products-blueprint__container" ref={containerRef}>
        
        {/* Left Side: Structured 40% Column */}
        <div className="products-blueprint__left">
          


          <div className="premium-labels-list">
            {LEFT_ALLOYS.map((alloy) => {
              const index = ALLOY_DATA.findIndex(a => a.id === alloy.id);
              return (
                <div
                  key={alloy.id}
                  ref={(el) => (labelRefs.current[index] = el)}
                  className={`blueprint-label premium-label ${
                    hoveredAlloy === alloy.id ? 'is-active' : ''
                  }`}
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  onMouseEnter={() => setHoveredAlloy(alloy.id)}
                  onMouseLeave={() => setHoveredAlloy(null)}
                >
                  <div className="blueprint-label__content">
                    <span className="blueprint-label__name">{alloy.name}</span>
                    <span className="blueprint-label__desc">{alloy.desc}</span>
                    <span className="premium-label__app">{alloy.app}</span>
                  </div>
                </div>
              );
            })}
          </div>



        </div>

        {/* Right Side: Hero Ingot (68%) + Right Labels */}
        <div className="products-blueprint__right">
          <div className="premium-image-wrapper">
            <div className="premium-image-glow" />
            <img
              src={ingotImg}
              alt="Premium Aluminium Alloy Ingot"
              className={`blueprint-image premium-image ${hoveredAlloy ? 'is-hovered' : ''}`}
            />
          </div>

          {/* Right-side alloy labels — always rendered so refs are set; CSS hides on mobile */}
          <div className="premium-right-labels">
            {RIGHT_ALLOYS.map((alloy) => {
              const index = ALLOY_DATA.findIndex(a => a.id === alloy.id);
              return (
                <div
                  key={alloy.id}
                  ref={(el) => (labelRefs.current[index] = el)}
                  className={`blueprint-label blueprint-label--right premium-label ${
                    hoveredAlloy === alloy.id ? 'is-active' : ''
                  }`}
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  onMouseEnter={() => setHoveredAlloy(alloy.id)}
                  onMouseLeave={() => setHoveredAlloy(null)}
                >
                  <div className="blueprint-label__content">
                    <span className="blueprint-label__name">{alloy.name}</span>
                    <span className="blueprint-label__desc">{alloy.desc}</span>
                    <span className="premium-label__app">{alloy.app}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Information Panel Removed */}
        </div>

        {/* Unified absolute overlay for connecting SVG lines and dots */}
        <div className="products-blueprint__annotations">
          {!isMobile && (
            <svg className="products-blueprint__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {ALLOY_DATA.map((alloy, index) => {
                const coords = lineCoords[index];
                if (!coords) return null;
                return (
                  <path 
                    key={`path-${alloy.id}`}
                    className={`blueprint-line premium-line ${hoveredAlloy === alloy.id ? 'is-active' : ''}`}
                    d={generatePath(coords.startX, coords.startY, alloy.targetX, coords.startY)}
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  />
                );
              })}
            </svg>
          )}

          {!isMobile && ALLOY_DATA.map((alloy, index) => {
            const coords = lineCoords[index];
            const dotY = coords ? coords.startY : alloy.targetY;
            return (
              <div 
                key={`dot-${alloy.id}`}
                className={`blueprint-dot premium-dot ${hoveredAlloy === alloy.id ? 'is-active' : ''}`}
                style={{ top: `${dotY}%`, left: `${alloy.targetX}%`, animationDelay: `${0.5 + index * 0.1}s` }}
                onMouseEnter={() => setHoveredAlloy(alloy.id)}
                onMouseLeave={() => setHoveredAlloy(null)}
              />
            );
          })}
        </div>

      </div>
      

    </section>
  );
}
