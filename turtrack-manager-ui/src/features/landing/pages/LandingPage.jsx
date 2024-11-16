import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import './LandingPage.css';

const Testimonial = ({ author, role, content, image }) => (
    <div className="testimonial-card">
        <div className="testimonial-content">{content}</div>
        <div className="testimonial-author">
            <img src={image} alt={author} className="author-image" />
            <div className="author-info">
                <h4>{author}</h4>
                <p>{role}</p>
            </div>
        </div>
    </div>
);

const PricingCard = ({ tier, price, features, recommended }) => (
    <div className={`pricing-card ${recommended ? 'recommended' : ''}`}>
        {recommended && <div className="recommended-badge">Most Popular</div>}
        <h3>{tier}</h3>
        <div className="price">
            <span className="currency">$</span>
            <span className="amount">{price}</span>
            <span className="period">/mo</span>
        </div>
        <ul className="features-list">
            {features.map((feature, index) => (
                <li key={index}>
                    <svg viewBox="0 0 24 24" width="16" height="16" className="check-icon">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    {feature}
                </li>
            ))}
        </ul>
        <button className={`${recommended ? 'primary-button' : 'secondary-button'} full-width`}>
            Get Started
        </button>
    </div>
);

const Faq = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            <div className="faq-question">
                <h4>{question}</h4>
                <svg viewBox="0 0 24 24" width="24" height="24" className="chevron-icon">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
            </div>
            <div className="faq-answer">{answer}</div>
        </div>
    );
};

const LandingPage = () => {
    const isAuthenticated = localStorage.getItem('token') !== null;

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const testimonials = [
        {
            author: "Sarah Johnson",
            role: "Fleet Manager",
            content: "TurTrack has completely transformed how we manage our vehicle fleet. The analytics are invaluable.",
            image: "/api/placeholder/48/48"
        },
        {
            author: "Michael Chen",
            role: "Business Owner",
            content: "The real-time updates and protection plan comparisons have helped us optimize our operations significantly.",
            image: "/api/placeholder/48/48"
        },
        {
            author: "Emily Rodriguez",
            role: "Operations Director",
            content: "Best investment we've made for our vehicle management. The ROI has been incredible.",
            image: "/api/placeholder/48/48"
        }
    ];

    const pricingTiers = [
        {
            tier: "Starter",
            price: "29",
            features: [
                "Up to 10 vehicles",
                "Basic analytics",
                "Email support",
                "Daily updates"
            ]
        },
        {
            tier: "Professional",
            price: "79",
            features: [
                "Up to 50 vehicles",
                "Advanced analytics",
                "Priority support",
                "Real-time updates",
                "API access"
            ],
            recommended: true
        },
        {
            tier: "Enterprise",
            price: "199",
            features: [
                "Unlimited vehicles",
                "Custom analytics",
                "24/7 support",
                "Real-time updates",
                "API access",
                "Custom integrations"
            ]
        }
    ];

    const faqs = [
        {
            question: "How does TurTrack handle data security?",
            answer: "We use industry-standard encryption and security measures to protect your data. All information is stored in secure, encrypted databases with regular backups."
        },
        {
            question: "Can I integrate TurTrack with my existing systems?",
            answer: "Yes! TurTrack offers API access and custom integrations to work seamlessly with your existing workflow and management systems."
        },
        {
            question: "What kind of support do you offer?",
            answer: "We provide email, chat, and phone support depending on your plan. Enterprise customers get dedicated account managers and 24/7 support."
        }
    ];

    return (
        <div className="landing-page">
            {/* Previous sections remain the same */}

            {/* Testimonials Section */}
            <section className="testimonials">
                <div className="container">
                    <h2>What Our Customers Say</h2>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <Testimonial key={index} {...testimonial} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section className="integrations">
                <div className="container">
                    <h2>Works With Your Favorite Platforms</h2>
                    <div className="platforms-grid">
                        <div className="platform">
                            <img src="/api/placeholder/120/40" alt="Platform 1" />
                        </div>
                        <div className="platform">
                            <img src="/api/placeholder/120/40" alt="Platform 2" />
                        </div>
                        <div className="platform">
                            <img src="/api/placeholder/120/40" alt="Platform 3" />
                        </div>
                        <div className="platform">
                            <img src="/api/placeholder/120/40" alt="Platform 4" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing">
                <div className="container">
                    <h2>Simple, Transparent Pricing</h2>
                    <p className="section-subtitle">Choose the plan that's right for your business</p>
                    <div className="pricing-grid">
                        {pricingTiers.map((tier, index) => (
                            <PricingCard key={index} {...tier} />
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq">
                <div className="container">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        {faqs.map((faq, index) => (
                            <Faq key={index} {...faq} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact">
                <div className="container">
                    <div className="contact-content">
                        <div className="contact-info">
                            <h2>Need Help?</h2>
                            <p>Our team is here to answer your questions and help you get started.</p>
                            <div className="contact-methods">
                                <div className="contact-method">
                                    <svg viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    </svg>
                                    <span>(555) 123-4567</span>
                                </div>
                                <div className="contact-method">
                                    <svg viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    </svg>
                                    <span>support@turtrack.com</span>
                                </div>
                            </div>
                        </div>
                        <div className="contact-image">
                            <img src="/api/placeholder/400/300" alt="Support team" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>TurTrack</h3>
                            <p>Your all-in-one solution for vehicle management and analytics.</p>
                        </div>
                        <div className="footer-section">
                            <h4>Product</h4>
                            <ul>
                                <li><a href="#">Features</a></li>
                                <li><a href="#">Pricing</a></li>
                                <li><a href="#">API</a></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Company</h4>
                            <ul>
                                <li><a href="#">About</a></li>
                                <li><a href="#">Blog</a></li>
                                <li><a href="#">Careers</a></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Resources</h4>
                            <ul>
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">Support</a></li>
                                <li><a href="#">Privacy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2024 TurTrack. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;