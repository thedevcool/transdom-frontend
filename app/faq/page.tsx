"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import SEO from "@/app/components/SEO";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://transdomlogistics.com";

export default function FAQ() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleFAQ = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I create an account?",
      answer:
        "You can create an account by clicking on the 'Get Started' button at the top of the page. Fill in your details including name, email, phone number, and password. Once completed, you'll receive a confirmation email to verify your account.",
    },
    {
      question: "What shipping methods do you offer?",
      answer:
        "We offer multiple shipping methods through our trusted carrier partners: DHL (Express), FedEx (Standard), and UPS (Economy). Each carrier varies in delivery time and cost. You can compare options and select the one that best suits your needs during the checkout process.",
    },
    {
      question: "How do I track my shipment?",
      answer:
        "Once your shipment is processed, you'll receive a tracking number via email and SMS. You can use this tracking number on our website to monitor your package's journey in real-time. Simply go to the 'Track Shipment' section and enter your tracking number.",
    },
    {
      question: "What if my payment fails?",
      answer:
        "If your payment fails, you can retry the payment using a different payment method. If your payment is debited from your account after a payment failure, it will be credited back within 7-10 business days. Please contact our support team if you need assistance.",
    },
    {
      question: "Can I cancel or modify my shipment?",
      answer:
        "You can cancel or modify your shipment before it has been picked up. Once the package is in transit, modifications are limited. Please contact our support team immediately if you need to make changes to an active shipment.",
    },
    {
      question: "What items are prohibited for shipping?",
      answer:
        "Prohibited items include hazardous materials, illegal substances, perishable goods (for certain services), weapons, and explosives. Please refer to our complete prohibited items list in the Terms of Service or contact support if you're unsure about a specific item.",
    },
    {
      question: "How are shipping costs calculated?",
      answer:
        "Shipping costs are calculated based on several factors including package weight, dimensions, destination, shipping method, and any additional services like insurance or express delivery. You can get an instant quote using our quotation calculator on the homepage.",
    },
    {
      question: "Do you offer insurance for shipments?",
      answer:
        "Yes, we offer insurance coverage for your shipments. Insurance protects your package against loss or damage during transit. You can add insurance during the checkout process for a small additional fee based on the declared value of your shipment.",
    },
    {
      question: "What are your delivery timeframes?",
      answer:
        "Delivery timeframes vary depending on the carrier and destination. DHL Express typically takes 3-5 business days, FedEx Standard takes 5-8 business days, and UPS Economy takes 8-12 business days.",
    },
    {
      question: "How do I contact customer support?",
      answer:
        "You can contact our customer support team through multiple channels: email at support@transdomlogistics.com, phone at +1 (555) 123-4567, or through our contact form on the Contact Us page. Our support team is available Monday to Friday, 9 AM - 6 PM.",
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="faq-page">
      <SEO
        title="FAQ - Frequently Asked Questions About Shipping"
        description="Find answers to common questions about international shipping, tracking, payments, delivery times, insurance, and more. Get help with Transdom Express logistics services."
        keywords="shipping FAQ, international shipping questions, tracking help, payment issues, delivery time, shipping insurance, prohibited items, shipping costs"
        canonical={`${siteUrl}/faq`}
        jsonLd={structuredData}
      />
      {/* Header/Navigation */}
      <header>
        <nav>
          <div className="logo-section">
            <Link href="/">
              <Image
                src="/assets/transdom_logo.svg"
                alt="Transdom Logistics"
                className="logo-img"
                width={40}
                height={40}
              />
            </Link>
            <span className="logo-text">Transdom Logistics</span>
          </div>
          <button
            className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`nav-links ${mobileMenuOpen ? "active" : ""}`}>
            <li>
              <Link href="/about-us" onClick={closeMobileMenu}>
                About Us
              </Link>
            </li>
            <li>
              <Link href="/faq" onClick={closeMobileMenu}>
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/contact-us" onClick={closeMobileMenu}>
                Contact Us
              </Link>
            </li>
          </ul>
          <div className={`nav-buttons ${mobileMenuOpen ? "active" : ""}`}>
            <button
              className="btn-sign-in"
              onClick={() => (window.location.href = "/sign-in")}
            >
              Sign In
            </button>
            <button
              className="btn-get-started"
              onClick={() => (window.location.href = "/sign-up")}
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="faq-hero">
        <div className="faq-hero-content">
          <h1>Ask us anything</h1>
          <p>Have any questions? We&apos;re here to assist you.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openFaqIndex === index ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {openFaqIndex === index ? "−" : "+"}
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="faq-cta">
        <div className="faq-cta-content">
          <h2>Still have questions?</h2>
          <p>
            Can&apos;t find the answer you&apos;re looking for? Please chat to
            our friendly team.
          </p>
          <Link href="/contact-us">
            <button className="btn-primary">Get In Touch</button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
