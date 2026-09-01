import React from 'react';
import './Quality.css';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const COMMITMENT_POINTS = [
  {
    id: '01',
    title: 'CONTROLLED MELTING',
    desc: 'Precise temperature and furnace control ensure uniform and consistent melting.'
  },
  {
    id: '02',
    title: 'ALLOY EXPERTISE',
    desc: 'Carefully managed alloy composition delivers the material properties required for demanding industrial applications.'
  },
  {
    id: '03',
    title: 'CONSISTENT OUTPUT',
    desc: 'Process discipline and quality checks help maintain reliable quality from molten metal to finished ingots.'
  }
];

export default function Quality() {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section className="sjmw-commitment" id="quality" ref={ref}>
      <div className="sjmw-commitment__container">
        
        {/* Left Column: Industrial Video */}
        <div className={`sjmw-commitment__visual ${isVisible ? 'is-visible' : ''}`}>
          <div className="sjmw-commitment__video-wrapper">
            <video 
              src="https://res.cloudinary.com/dmemdpd69/video/upload/v1787466683/WhatsApp_Video_2026-08-23_at_8.20.52_AM.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline
              controls={false}
              className="sjmw-commitment__video"
            ></video>
            <div className="sjmw-commitment__video-overlay"></div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className={`sjmw-commitment__content ${isVisible ? 'is-visible' : ''}`}>

          <h2 className="sjmw-commitment__title">
            Precision Begins at the Furnace.
          </h2>
          <p className="sjmw-commitment__desc">
            Every high-performance aluminium alloy begins with a controlled process. At SJMW, our melting, alloying and casting operations are carefully managed to deliver consistency you can rely on.
          </p>

          <div className="sjmw-commitment__points">
            {COMMITMENT_POINTS.map((point) => (
              <div key={point.id} className="sjmw-commitment__point">
                <div className="sjmw-commitment__point-id">{point.id}</div>
                <div className="sjmw-commitment__point-text">
                  <h3 className="sjmw-commitment__point-title">{point.title}</h3>
                  <p className="sjmw-commitment__point-desc">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="sjmw-commitment__stats">
            <div className="sjmw-commitment__stat">
              <span className="stat-number">01</span>
              <span className="stat-title">CONSISTENT QUALITY</span>
              <span className="stat-desc">Reliable alloy composition and controlled production.</span>
            </div>
            <div className="sjmw-commitment__stat-divider"></div>
            <div className="sjmw-commitment__stat">
              <span className="stat-number">02</span>
              <span className="stat-title">INDUSTRIAL PERFORMANCE</span>
              <span className="stat-desc">Aluminium alloys built for demanding industrial applications.</span>
            </div>
            <div className="sjmw-commitment__stat-divider"></div>
            <div className="sjmw-commitment__stat">
              <span className="stat-number">03</span>
              <span className="stat-title">RELIABLE SUPPLY</span>
              <span className="stat-desc">Consistent production to support ongoing industrial requirements.</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
