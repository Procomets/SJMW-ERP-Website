import React from 'react';
import './Testimonials.css';

export default function TestimonialCard({ testimonial, offset }) {
  let positionClass = 'hidden';
  if (offset === 0) positionClass = 'center';
  else if (offset === -1) positionClass = 'left';
  else if (offset === 1) positionClass = 'right';
  else if (offset < -1) positionClass = 'far-left';
  else if (offset > 1) positionClass = 'far-right';

  return (
    <div className={`sjmw-testimonial-card ${positionClass}`}>
      <div className="sjmw-testimonial-card__quote-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      <p className="sjmw-testimonial-card__text">
        "{testimonial.text}"
      </p>
      <div className="sjmw-testimonial-card__footer">
        <div className="sjmw-testimonial-card__avatar">
          <img src={testimonial.avatar} alt={`${testimonial.company} Avatar`} className="sjmw-testimonial-card__logo-img" />
        </div>
        <div className="sjmw-testimonial-card__info">
          <span className="sjmw-testimonial-card__name">{testimonial.company}</span>
          <span className="sjmw-testimonial-card__role">{testimonial.industry}</span>
        </div>
      </div>
    </div>
  );
}
