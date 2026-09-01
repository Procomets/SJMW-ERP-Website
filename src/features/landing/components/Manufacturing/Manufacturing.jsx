import React, { useState, useEffect, useRef } from 'react';
import './Manufacturing.css';
import { manufacturingSteps } from '../../data/manufacturingSteps';
import { useScrollReveal } from '../../hooks/useScrollReveal';

/* ─────────────────────────────────────────────────────────────
   TimelineStage — one row of the vertical timeline
───────────────────────────────────────────────────────────── */
function TimelineStage({ step, isActive, side, entryVisible, index }) {
  const isLeft = side === 'left';

  return (
    <div
      className={`tl-stage ${isActive ? 'is-active' : ''} tl-stage--${side}`}
      style={{ '--stage-delay': `${index * 0.12}s` }}
    >
      <div className={`tl-stage__content tl-stage__content--left has-content ${entryVisible ? 'is-entered' : ''} ${isLeft ? 'tl-content-text' : 'tl-content-image'}`}>
        {isLeft ? (
          <>
            <h3 className="tl-stage__title">{step.title}</h3>
            <p className="tl-stage__desc">{step.description}</p>
          </>
        ) : (
          <div className="tl-stage__image-wrapper">
            <img src={step.image} alt={step.title} className="tl-stage__image" />
          </div>
        )}
      </div>

      {/* ── Central Node ── */}
      <div className="tl-stage__node-col">
        {/* Connector dot from content side to node */}
        <div className="tl-stage__arm" />

        {/* The numbered circle */}
        <div className="tl-node">
          <span className="tl-node__num">{String(step.id).padStart(2, '0')}</span>
          <div className="tl-node__glow" aria-hidden="true" />
        </div>

        {/* Connector dot on the other side */}
        <div className="tl-stage__arm tl-stage__arm--right" />
      </div>

      <div className={`tl-stage__content tl-stage__content--right has-content ${entryVisible ? 'is-entered' : ''} ${!isLeft ? 'tl-content-text' : 'tl-content-image'}`}>
        {!isLeft ? (
          <>
            <h3 className="tl-stage__title">{step.title}</h3>
            <p className="tl-stage__desc">{step.description}</p>
          </>
        ) : (
          <div className="tl-stage__image-wrapper">
            <img src={step.image} alt={step.title} className="tl-stage__image" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Manufacturing — main section
───────────────────────────────────────────────────────────── */
export default function Manufacturing() {
  const { ref: sectionRef, isVisible } = useScrollReveal(0.05);
  const timelineRef = useRef(null);

  // scrollProgress: 0 → 1 — how far down the section user has scrolled
  const [scrollProgress, setScrollProgress] = useState(0);

  // Which stage is currently "active" based on scroll position
  const [activeId, setActiveId] = useState(0);

  // Track which stages have become visible (for entrance animation, trigger once)
  const [enteredStages, setEnteredStages] = useState(new Set());

  // ── Scroll listener: drives the timeline progress line downward ──
  useEffect(() => {
    if (!isVisible || !sectionRef.current) return;

    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const { top, height } = section.getBoundingClientRect();
      const viewH = window.innerHeight;

      // progress: 0 when section top is at bottom of viewport, 1 when section bottom is at top
      const raw = (viewH - top) / (height + viewH);
      const progress = Math.max(0, Math.min(1, raw));
      setScrollProgress(progress);

      // Determine active stage (0 = none yet)
      const stageCount = manufacturingSteps.length;
      const perStage = 1 / stageCount;
      const currentStage = Math.ceil(progress / perStage);
      const clampedStage = Math.max(0, Math.min(stageCount, currentStage));
      setActiveId(clampedStage);

      // Mark stages as permanently entered once they become active
      setEnteredStages((prev) => {
        if (clampedStage > 0 && !prev.has(clampedStage)) {
          const next = new Set(prev);
          // Add all stages up to current
          for (let i = 1; i <= clampedStage; i++) next.add(i);
          return next;
        }
        return prev;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once immediately
    return () => window.removeEventListener('scroll', onScroll);
  }, [isVisible]);

  return (
    <section
      id="manufacturing"
      className={`mfg-section ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="mfg-heading"
      ref={sectionRef}
    >
      {/* Subtle technical grid */}
      <div className="mfg-bg-grid" aria-hidden="true" />

      <div className="mfg-container">

        {/* ── Section Header ────────────────────────────────── */}
        <header className={`mfg-header ${isVisible ? 'is-visible' : ''}`}>

          <h2 id="mfg-heading" className="mfg-heading">
            Our Aluminium{' '}
            <span className="mfg-heading__accent">Manufacturing</span>{' '}
            Process
          </h2>
          <p className="mfg-subheading">
            At Sri Jothi Moulding Works, every aluminium alloy ingot is manufactured through a carefully
            controlled production process, combining advanced technology, skilled craftsmanship, and
            rigorous quality control to deliver premium industrial-grade aluminium alloys.
          </p>
        </header>

        {/* ── Vertical Timeline ────────────────────────────── */}
        <div className="tl-wrapper" ref={timelineRef}>

          {/* ── The backbone vertical line ── */}
          <div className="tl-track">
            {/* Gray base line */}
            <div className="tl-track__base" />
            {/* Blue progress line — grows downward via scaleY */}
            <div
              className="tl-track__progress"
              style={{ transform: `scaleY(${scrollProgress})` }}
            />
          </div>

          {/* ── Stages ── */}
          {manufacturingSteps.map((step, index) => {
            // Step 1 (index 0) has text on the right (so side='right', isLeft=false)
            // Step 2 (index 1) has text on the left (so side='left', isLeft=true)
            const side = index % 2 === 0 ? 'right' : 'left';
            return (
              <TimelineStage
                key={step.id}
                step={step}
                isActive={activeId >= step.id}
                side={side}
                entryVisible={enteredStages.has(step.id)}
                index={index}
              />
            );
          })}

        </div>{/* /tl-wrapper */}

      </div>{/* /mfg-container */}
    </section>
  );
}
