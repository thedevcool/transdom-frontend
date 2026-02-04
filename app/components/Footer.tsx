'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo" aria-label="Transdom Logistics">
            <Image
              src="/assets/transdom_logo.svg"
              alt="Transdom Logistics"
              width={160}
              height={36}
            />
          </div>
          <p style={{ color: '#aaa', marginBottom: '1rem' }}>Leading logistics platform simplifying shipping to 200+ countries worldwide.</p>
          <div className="social-links">
            <a
              href="https://facebook.com/transdomlogistics"
              className="social-icon"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
            >
              <Image src="/assets/facebook.svg" alt="Facebook" width={18} height={18} />
            </a>
            <a href="#" className="social-icon" aria-label="Telegram">
              <Image src="/assets/telegram.svg" alt="Telegram" width={18} height={18} />
            </a>
            <a href="#" className="social-icon" aria-label="LinkedIn">
              <Image src="/assets/linkedin.svg" alt="LinkedIn" width={18} height={18} />
            </a>
            <a
              href="https://instagram.com/transdomlogistics"
              className="social-icon"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <Image src="/assets/instagram.svg" alt="Instagram" width={18} height={18} />
            </a>
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
  );
}
