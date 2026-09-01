import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { alloys } from '../../data/alloys';
import './Catalogue.css';

const CATEGORIES = [
  'All',
  'Die Casting Alloys',
  'Gravity Casting Alloys',
  'Automotive Alloys',
  'Engineering Alloys',
  'Customized Alloys'
];

export default function Catalogue() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialCategory = location.state?.category || 'All';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Sync category if navigated from footer while already on the page
  useEffect(() => {
    if (location.state?.category) {
      setActiveCategory(location.state.category);
    }
  }, [location.state?.category]);

  // Scroll to top on mount or location change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Filter logic
  const filteredAlloys = useMemo(() => {
    return alloys.filter(alloy => {
      // Basic text search across multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        alloy.name.toLowerCase().includes(searchLower) ||
        alloy.badge.toLowerCase().includes(searchLower) ||
        alloy.description.toLowerCase().includes(searchLower) ||
        alloy.properties.some(p => p.toLowerCase().includes(searchLower)) ||
        alloy.applications.some(a => a.toLowerCase().includes(searchLower));

      // Category matching
      // Note: The existing alloys.js doesn't have explicit "Die Casting Alloys" categories, 
      // it has "badge" or we can search within applications/description.
      // We will map the active category to simple keyword checks if it's not "All".
      let matchesCategory = true;
      if (activeCategory !== 'All') {
        const catLower = activeCategory.toLowerCase().replace(' alloys', '');
        matchesCategory = 
          alloy.badge.toLowerCase().includes(catLower) ||
          alloy.description.toLowerCase().includes(catLower) ||
          alloy.applications.some(a => a.toLowerCase().includes(catLower)) ||
          alloy.properties.some(p => p.toLowerCase().includes(catLower));
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="sjmw-catalogue-page">
      <div className="sjmw-catalogue__container">
        
        {/* Navigation & Header */}
        <nav className="sjmw-catalogue__nav">
          <Link to="/#products" className="sjmw-catalogue__back-link">
            <span aria-hidden="true">←</span> Back to Products
          </Link>
        </nav>

        <header className="sjmw-catalogue__header">
          <h1 className="sjmw-catalogue__title">OUR ALLOY CATALOGUE</h1>
          <p className="sjmw-catalogue__subtitle">
            Explore our complete range of aluminium alloys for die casting, engineering, automotive and industrial applications.
          </p>
        </header>

        {/* Controls: Search and Filters */}
        <div className="sjmw-catalogue__controls">
          <div className="sjmw-catalogue__search-wrapper">
            <svg className="sjmw-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              className="sjmw-catalogue__search" 
              placeholder="Search by alloy code, application, or property..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sjmw-catalogue__filters">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                className={`sjmw-filter-pill ${activeCategory === cat ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Results */}
        <div className="sjmw-catalogue__grid">
          {filteredAlloys.length > 0 ? (
            filteredAlloys.map((alloy, index) => (
              <div 
                key={alloy.id} 
                className="sjmw-alloy-card animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="sjmw-alloy-card__header">
                  <span className="sjmw-alloy-card__badge">{alloy.badge}</span>
                  <h3 className="sjmw-alloy-card__name">{alloy.name}</h3>
                </div>
                
                <div className="sjmw-alloy-card__body">
                  <p className="sjmw-alloy-card__desc">{alloy.description}</p>
                  
                  <div className="sjmw-alloy-card__section">
                    <span className="sjmw-section-title">Applications</span>
                    <p className="sjmw-section-text">{alloy.applications.slice(0, 3).join(', ')}</p>
                  </div>
                </div>

                <div className="sjmw-alloy-card__footer">
                  <button className="sjmw-alloy-card__cta" onClick={() => alert(`Showing details for ${alloy.fullTitle}:\n\nComposition: ${alloy.composition}\nStandard: ${alloy.standard}\n\nProperties:\n- ${alloy.properties.join('\n- ')}`)}>
                    View Details <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="sjmw-catalogue__empty">
              <p>No alloys found matching your search criteria.</p>
              <button className="sjmw-reset-btn" onClick={() => {setSearchTerm(''); setActiveCategory('All');}}>
                Reset Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
