'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function QuotationPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'international' | 'local'>('international');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    route: '',
    weight: '',
    speed: '',
    cost: ''
  });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleInternationalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const pickupCountry = formData.get('pickup-country') as string;
    const destinationCountry = formData.get('destination-country') as string;
    const weight = parseFloat(formData.get('weight') as string);
    const deliverySpeed = formData.get('delivery-speed') as string;

    if (!pickupCountry || !destinationCountry || !weight || !deliverySpeed) {
      alert('Please fill in all required fields');
      return;
    }

    let baseRate = 15;
    let speedMultiplier = 1;

    switch(deliverySpeed) {
      case 'express':
        speedMultiplier = 1.8;
        break;
      case 'standard':
        speedMultiplier = 1.3;
        break;
      case 'economy':
        speedMultiplier = 1.0;
        break;
    }

    const estimatedCost = (baseRate * weight * speedMultiplier).toFixed(2);

    setResults({
      route: `${pickupCountry.charAt(0).toUpperCase() + pickupCountry.slice(1)} → ${destinationCountry.charAt(0).toUpperCase() + destinationCountry.slice(1)}`,
      weight: `${weight} KG`,
      speed: deliverySpeed.charAt(0).toUpperCase() + deliverySpeed.slice(1),
      cost: `$${estimatedCost}`
    });

    setShowResults(true);
  };

  const handleLocalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const pickupState = formData.get('local-pickup-state') as string;
    const destinationState = formData.get('local-destination-state') as string;
    const weight = parseFloat(formData.get('local-weight') as string);
    const deliverySpeed = formData.get('local-delivery-speed') as string;

    if (!pickupState || !destinationState || !weight || !deliverySpeed) {
      alert('Please fill in all required fields');
      return;
    }

    let baseRate = 5;
    let speedMultiplier = 1;

    switch(deliverySpeed) {
      case 'same-day':
        speedMultiplier = 2.0;
        break;
      case 'next-day':
        speedMultiplier = 1.5;
        break;
      case 'standard':
        speedMultiplier = 1.0;
        break;
    }

    const estimatedCost = (baseRate * weight * speedMultiplier * 750).toFixed(2);

    setResults({
      route: `${pickupState.charAt(0).toUpperCase() + pickupState.slice(1)} → ${destinationState.charAt(0).toUpperCase() + destinationState.slice(1)}`,
      weight: `${weight} KG`,
      speed: deliverySpeed.replace('-', ' ').charAt(0).toUpperCase() + deliverySpeed.replace('-', ' ').slice(1),
      cost: `₦${estimatedCost}`
    });

    setShowResults(true);
  };

  const resetForm = () => {
    setShowResults(false);
    setResults({
      route: '',
      weight: '',
      speed: '',
      cost: ''
    });
  };

  return (
    <>
      {/* Header/Navigation */}
      <header>
        <nav>
          <div className="logo-section">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
              <Image src="/assets/transdom_logo.svg" alt="Transdom Logistics" className="logo-img" width={40} height={40} />
              <span className="logo-text">Transdom Logistics</span>
            </Link>
          </div>
          <button className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <li><Link href="/#about" onClick={closeMobileMenu}>About Us</Link></li>
            <li><Link href="/#faq" onClick={closeMobileMenu}>FAQs</Link></li>
            <li><Link href="/#contact" onClick={closeMobileMenu}>Contact Us</Link></li>
          </ul>
          <div className={`nav-buttons ${mobileMenuOpen ? 'active' : ''}`}>
            <button className="btn-sign-in">Sign In</button>
            <button className="btn-get-started" onClick={() => window.location.href='/sign-up'}>Get Started</button>
          </div>
        </nav>
      </header>

      {/* Quotation Form Section */}
      <section className="quotation-form-section">
        <div className="quotation-wrapper">
          <div className="quotation-text-content">
            <h1>Shipping Price Calculator</h1>
            <p>Calculate your shipping costs in seconds. Easily determine the cost of shipping your packages by inputting your country, shipment weight, and delivery options and receive an instant, accurate estimate of your shipping cost.</p>
            <div className="quotation-text-image">
              <Image src="/assets/hero_image.svg" alt="Shipping Illustration" width={600} height={400} />
            </div>
          </div>
          <div className="quotation-container">
          <div className="shipping-tabs">
            <button 
              className={`tab-btn ${activeTab === 'international' ? 'active' : ''}`}
              onClick={() => { setActiveTab('international'); setShowResults(false); }}
            >
              INTERNATIONAL
            </button>
            <button 
              className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
              onClick={() => { setActiveTab('local'); setShowResults(false); }}
            >
              LOCAL
            </button>
          </div>

          {/* International Form */}
          {activeTab === 'international' && (
            <form className="quotation-form" onSubmit={handleInternationalSubmit}>
              <h3 className="form-section-title">Pickup</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickup-country">Country</label>
                  <select name="pickup-country" id="pickup-country" className="form-control" required>
                    <option value="">Select Country</option>
                    <option value="nigeria">Nigeria</option>
                    <option value="ghana">Ghana</option>
                    <option value="kenya">Kenya</option>
                    <option value="south-africa">South Africa</option>
                    <option value="egypt">Egypt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="pickup-state">State</label>
                  <select name="pickup-state" id="pickup-state" className="form-control">
                    <option value="">Select State</option>
                  </select>
                </div>
              </div>

              <h3 className="form-section-title">Destination</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="destination-country">Country</label>
                  <select name="destination-country" id="destination-country" className="form-control" required>
                    <option value="">Select Country</option>
                    <option value="usa">United States</option>
                    <option value="uk">United Kingdom</option>
                    <option value="canada">Canada</option>
                    <option value="china">China</option>
                    <option value="germany">Germany</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="destination-state">State</label>
                  <select name="destination-state" id="destination-state" className="form-control">
                    <option value="">Select State</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="weight">Weight (KG)</label>
                  <input type="number" name="weight" id="weight" className="form-control" placeholder="Enter weight" min="0.1" step="0.1" required />
                </div>
                <div className="form-group">
                  <label htmlFor="delivery-speed">Delivery Speed</label>
                  <select name="delivery-speed" id="delivery-speed" className="form-control" required>
                    <option value="">Select Speed</option>
                    <option value="express">Express (3-5 Days)</option>
                    <option value="standard">Standard (5-8 Days)</option>
                    <option value="economy">Economy (8-12 Days)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-calculate">GET PRICING</button>
            </form>
          )}

          {/* Local Form */}
          {activeTab === 'local' && (
            <div className="quotation-form" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h3 className="form-section-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Coming Soon</h3>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
                Local delivery calculator will be available soon. Stay tuned!
              </p>
              <div style={{ fontSize: '3rem', opacity: '0.3' }}>🚚</div>
            </div>
          )}
          {/* 
          {activeTab === 'local' && (
            <form className="quotation-form" onSubmit={handleLocalSubmit}>
              <h3 className="form-section-title">Pickup</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="local-pickup-state">State</label>
                  <select name="local-pickup-state" id="local-pickup-state" className="form-control" required>
                    <option value="">Select State</option>
                    <option value="lagos">Lagos</option>
                    <option value="abuja">Abuja</option>
                    <option value="port-harcourt">Port Harcourt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="local-pickup-city">City</label>
                  <select name="local-pickup-city" id="local-pickup-city" className="form-control" required>
                    <option value="">Select City</option>
                  </select>
                </div>
              </div>

              <h3 className="form-section-title">Destination</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="local-destination-state">State</label>
                  <select name="local-destination-state" id="local-destination-state" className="form-control" required>
                    <option value="">Select State</option>
                    <option value="lagos">Lagos</option>
                    <option value="abuja">Abuja</option>
                    <option value="port-harcourt">Port Harcourt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="local-destination-city">City</label>
                  <select name="local-destination-city" id="local-destination-city" className="form-control" required>
                    <option value="">Select City</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="local-weight">Weight (KG)</label>
                  <input type="number" name="local-weight" id="local-weight" className="form-control" placeholder="Enter weight" min="0.1" step="0.1" required />
                </div>
                <div className="form-group">
                  <label htmlFor="local-delivery-speed">Delivery Speed</label>
                  <select name="local-delivery-speed" id="local-delivery-speed" className="form-control" required>
                    <option value="">Select Speed</option>
                    <option value="same-day">Same Day</option>
                    <option value="next-day">Next Day</option>
                    <option value="standard">Standard (2-3 Days)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-calculate">GET PRICING</button>
            </form>
          )}
          */}

          {/* Results Section */}
          {showResults && (
            <div className="pricing-results">
              <h3>Your Shipping Quote</h3>
              <div className="result-details">
                <div className="result-item">
                  <span className="result-label">Route:</span>
                  <span className="result-value">{results.route}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Weight:</span>
                  <span className="result-value">{results.weight}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Delivery Speed:</span>
                  <span className="result-value">{results.speed}</span>
                </div>
                <div className="result-item total">
                  <span className="result-label">Estimated Cost:</span>
                  <span className="result-value">{results.cost}</span>
                </div>
              </div>
              <div className="result-actions">
                <button className="btn-primary" onClick={() => window.location.href='#'}>Book Shipment</button>
                <button className="btn-secondary" onClick={resetForm}>Calculate Again</button>
              </div>
            </div>
          )}
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta" id="contact">
        <h2>Ready to Ship with Transdom?</h2>
        <p>Start shipping today and experience the difference of world-class logistics</p>
        <button className="btn-primary">Get Started Now</button>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Transdom</h4>
            <p style={{ color: '#aaa', marginBottom: '1rem' }}>Leading logistics platform simplifying shipping to 200+ countries worldwide.</p>
            <div className="social-links">
              <a href="#" className="social-icon">f</a>
              <a href="#" className="social-icon">t</a>
              <a href="#" className="social-icon">in</a>
              <a href="#" className="social-icon">ig</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><a href="#">International Shipping</a></li>
              <li><a href="#">Local Delivery</a></li>
              <li><a href="#">Cargo Services</a></li>
              <li><a href="#">Tracking</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link href="/#about">About Us</Link></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><Link href="/#contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><Link href="/#faq">FAQ</Link></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Transdom Logistics. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
