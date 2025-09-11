import { Link } from 'react-router-dom';
import { BarChart3, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-semibold text-foreground">Ocean Hazard Platform</span>
                <div className="text-sm text-muted-foreground">Ministry of Earth Sciences</div>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              An integrated platform for crowdsourced ocean hazard reporting and social media analytics, 
              empowering citizens to contribute to marine safety and environmental monitoring.
            </p>
            <div className="text-xs text-muted-foreground">
              © 2024 Ministry of Earth Sciences, Government of India. All rights reserved.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-smooth">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-muted-foreground hover:text-primary transition-smooth">
                  Report Hazard
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-smooth">
                  About Platform
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">ocean@moes.gov.in</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">+91-11-2334-1000</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Block No. 12, CGO Complex<br />
                  Lodi Road, New Delhi - 110003
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;