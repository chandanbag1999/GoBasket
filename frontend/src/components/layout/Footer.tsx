import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';

// Components
import Container from './Container';

// Constants
import { APP_CONFIG, ROUTES } from '@/constants';

/**
 * Footer Component
 * 
 * Features:
 * - Company information
 * - Quick links
 * - Contact information
 * - Social media links
 * - Newsletter signup
 * - App download links
 * - Legal links
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'How it Works', href: '/how-it-works' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Blog', href: '/blog' },
  ];

  const customerService = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Returns & Refunds', href: '/returns' },
    { name: 'FAQ', href: '/faq' },
  ];

  const legal = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Delivery Policy', href: '/delivery-policy' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <Container>
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-primary-500 text-white rounded-lg p-2">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <span className="text-xl font-display font-bold">
                  {APP_CONFIG.name}
                </span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                India's fastest grocery delivery service. Fresh groceries 
                delivered to your doorstep in minutes.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Phone className="h-4 w-4 mr-3 text-primary-400" />
                  <span>{APP_CONFIG.contact.phone}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-3 text-primary-400" />
                  <span>{APP_CONFIG.contact.email}</span>
                </div>
                <div className="flex items-start text-gray-300">
                  <MapPin className="h-4 w-4 mr-3 mt-1 text-primary-400 flex-shrink-0" />
                  <span>Mumbai, Maharashtra, India</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-3">
                {customerService.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter & App Download */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Connected</h3>
              <p className="text-gray-300 mb-4">
                Get updates on new offers and products
              </p>
              
              {/* Newsletter Signup */}
              <div className="mb-6">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                  <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-r-lg transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>

              {/* App Download */}
              <div className="mb-6">
                <p className="text-sm text-gray-300 mb-3">Download our app</p>
                <div className="flex space-x-2">
                  <a
                    href="#"
                    className="inline-block"
                  >
                    <img
                      src="/images/google-play-badge.png"
                      alt="Get it on Google Play"
                      className="h-10"
                    />
                  </a>
                  <a
                    href="#"
                    className="inline-block"
                  >
                    <img
                      src="/images/app-store-badge.png"
                      alt="Download on the App Store"
                      className="h-10"
                    />
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-sm text-gray-300 mb-3">Follow us</p>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => {
                    const IconComponent = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        className="p-2 bg-gray-800 hover:bg-primary-500 text-gray-300 hover:text-white rounded-lg transition-colors"
                        aria-label={social.name}
                      >
                        <IconComponent className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            {/* Copyright */}
            <div className="text-gray-300 text-sm mb-4 lg:mb-0">
              © {currentYear} {APP_CONFIG.name}. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-end space-x-6">
              {legal.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-gray-300 hover:text-primary-400 text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
