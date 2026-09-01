import React, { useState, useEffect } from 'react';
import TestimonialCard from './TestimonialCard';
import { testimonialData } from '../../data/testimonialData';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Testimonials.css';

export default function Testimonials() {
  const { ref, isVisible } = useScrollReveal();
  const [activeIndex, setActiveIndex] = useState(0);

  const numItems = testimonialData.length;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % numItems);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + numItems) % numItems);
  };

  // Optional: Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      id="testimonials" 
      className={`sjmw-testimonials reveal-section ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
      aria-label="Client Testimonials"
    >
      <div className="sjmw-testimonials__bg-grid" aria-hidden="true" />
      
      <div className="sjmw-testimonials__container">
        <header className="sjmw-testimonials__header">
          <h2 className="sjmw-testimonials__title animate-fade-up" style={{ animationDelay: '0.1s' }}>
            What our Clients say!
          </h2>
        </header>

        <div className="sjmw-carousel-wrapper animate-fade-up" style={{ animationDelay: '0.3s' }}>
          
          <button className="sjmw-carousel-arrow sjmw-carousel-arrow--left" onClick={prevSlide} aria-label="Previous testimonial">
            &#10094;
          </button>

          <div className="sjmw-carousel">
            {testimonialData.map((testimonial, index) => {
              // Calculate offset: 0 is center, -1 is left, 1 is right
              let offset = index - activeIndex;
              if (offset < -Math.floor(numItems / 2)) offset += numItems;
              if (offset > Math.floor(numItems / 2)) offset -= numItems;

              return (
                <TestimonialCard 
                  key={testimonial.id} 
                  testimonial={testimonial} 
                  offset={offset}
                />
              );
            })}
          </div>

          <button className="sjmw-carousel-arrow sjmw-carousel-arrow--right" onClick={nextSlide} aria-label="Next testimonial">
            &#10095;
          </button>
          
        </div>
        
        {/* Pagination Dots */}
        <div className="sjmw-carousel-dots">
          {testimonialData.map((_, index) => (
            <button 
              key={index} 
              className={`sjmw-carousel-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
