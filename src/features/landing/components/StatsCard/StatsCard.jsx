import './StatsCard.css';

/**
 * StatsCard Component
 *
 * Glassmorphism card displaying a single statistic.
 *
 * Props:
 *   number  {string} — Displayed metric value, e.g. "35+"
 *   label   {string} — Description label, e.g. "Years in Industry"
 *   delay   {string} — CSS animation-delay for stagger, e.g. "0.2s"
 */
export default function StatsCard({ number, label, delay = '0s' }) {
  return (
    <article
      className="stats-card"
      style={{ '--float-delay': delay }}
      aria-label={`${number} ${label}`}
    >
      <span className="stats-card__number" aria-hidden="true">
        {number}
      </span>
      <span className="stats-card__label">{label}</span>
    </article>
  );
}
