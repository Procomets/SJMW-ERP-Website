import React from 'react';
import './Capability.css';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const FEATURES = [
  {
    id: '01',
    title: 'ALUMINIUM ALLOYS',
    desc: 'A wide range of aluminium alloy grades for diverse industrial requirements.'
  },
  {
    id: '02',
    title: 'PRECISION CASTING',
    desc: 'Controlled melting and casting processes designed for consistent quality and performance.'
  },
  {
    id: '03',
    title: 'QUALITY ASSURANCE',
    desc: 'Rigorous material inspection, composition control and process monitoring throughout production.'
  },
  {
    id: '04',
    title: 'INDUSTRIAL APPLICATIONS',
    desc: 'Reliable aluminium solutions for automotive, engineering, marine and other industrial sectors.'
  }
];

export default function Capability() {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section className="sjmw-whatwedo" id="what-we-do" ref={ref}>
      <div className="sjmw-whatwedo__container">
        
        {/* Left Column: Content */}
        <div className={`sjmw-whatwedo__content ${isVisible ? 'is-visible' : ''}`}>

          <h2 className="sjmw-whatwedo__title">
            Aluminium built around your industry.
          </h2>
          <p className="sjmw-whatwedo__subtitle">
            From alloy selection to final casting, we deliver reliable aluminium solutions engineered for demanding industrial applications.
          </p>
          
          <div className="sjmw-whatwedo__features">
            {FEATURES.map((feat) => (
              <div key={feat.id} className="sjmw-whatwedo__feature">
                <span className="sjmw-whatwedo__feature-id">{feat.id}</span>
                <div className="sjmw-whatwedo__feature-text">
                  <h3 className="sjmw-whatwedo__feature-title">{feat.title}</h3>
                  <p className="sjmw-whatwedo__feature-desc">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Visual */}
        <div className={`sjmw-whatwedo__visual ${isVisible ? 'is-visible' : ''}`}>
          <div className="sjmw-whatwedo__video-wrapper">
            <video 
              src="https://res.cloudinary.com/dmemdpd69/video/upload/v1787467118/Video_3.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline
              controls={false}
              className="sjmw-whatwedo__video"
            ></video>
            


            {/* Floating Label 2 */}
            <div className="sjmw-whatwedo__floating-label label-2">
              <div className="label-text">
                <span className="label-bold">Premium</span>
                <span className="label-light">Aluminium Alloy Ingots</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
