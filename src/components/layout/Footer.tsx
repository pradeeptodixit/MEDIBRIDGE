import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Phone, MapPin, Shield } from 'lucide-react';
import { MediBridgeLogo } from '../ui/MediBridgeLogo';

export const Footer: React.FC = () => (
  <footer className="bg-slate-900 text-slate-400 mt-auto" role="contentinfo">
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Brand */}
      <div className="md:col-span-1">
        <div className="flex items-center gap-2 mb-4">
          <MediBridgeLogo size={32} dark={true} />
          <span className="text-white font-bold font-display text-lg">MediBridge AI</span>
        </div>
        <p className="text-sm leading-relaxed mb-4">
          Smart Rural Health Navigator — AI-powered triage guidance for rural and semi-urban India.
        </p>
        <div className="flex items-center gap-2 text-xs text-teal-400">
          <Shield size={14} />
          <span>Private & Secure. No data stored.</span>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
        <ul className="space-y-2">
          {[
            { to: '/', label: 'Home' },
            { to: '/assessment', label: 'AI Assessment' },
            { to: '/facility-matching', label: 'Facility Matching' },
            { to: '/report', label: 'Health Report' },
            { to: '/resources', label: 'Health Guides' },
            { to: '/about', label: 'About Us' },
          ].map(link => (
            <li key={link.to}>
              <Link to={link.to} className="text-sm hover:text-teal-400 transition-colors">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Emergency */}
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Emergency Numbers</h3>
        <ul className="space-y-3">
          {[
            { number: '108', label: 'Ambulance (EMRI)', color: 'text-red-400' },
            { number: '112', label: 'National Emergency', color: 'text-red-400' },
            { number: '104', label: 'Health Helpline', color: 'text-yellow-400' },
            { number: '1800-180-1104', label: 'NHP Helpline', color: 'text-blue-400' },
          ].map(item => (
            <li key={item.number} className="flex items-center gap-2">
              <Phone size={14} className={item.color} />
              <a href={`tel:${item.number}`} className={`font-bold ${item.color} hover:underline`}>
                {item.number}
              </a>
              <span className="text-xs text-slate-500">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mission */}
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Our Mission</h3>
        <p className="text-sm leading-relaxed mb-4">
          Healthcare guidance should not depend on where you live. We are bridging the urban-rural health divide through accessible AI.
        </p>
        <div className="flex items-center gap-1 text-xs">
          <MapPin size={13} className="text-teal-500" />
          <span>Built for Bharat 🇮🇳</span>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p className="flex items-center gap-1">
          Made with <Heart size={12} className="text-red-500 mx-1" fill="currentColor" /> in India
          <span className="ml-2 px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded">⚠ Not a medical device</span>
        </p>
      </div>
    </div>
  </footer>
);
