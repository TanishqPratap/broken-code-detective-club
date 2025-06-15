
import { Heart, Github, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8 sm:py-12 mt-12 sm:mt-20 w-full">
      <div className="ml-64 px-4 max-w-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-brand-light-cyan to-brand-cyan bg-clip-text text-transparent">
              CreatorHub
            </h3>
            <p className="text-white mb-4 text-sm sm:text-base">
              Empowering creators to build communities and monetize their passion.
            </p>
            <div className="flex justify-center sm:justify-start space-x-4">
              <a href="#" className="text-brand-cyan hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-brand-cyan hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-brand-cyan hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help-center" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="text-white hover:text-brand-cyan transition-colors text-sm sm:text-base">
                  DMCA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-600 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-white text-xs sm:text-sm text-center md:text-left">
            © 2024 CreatorHub. All rights reserved.
          </p>
          <div className="flex items-center text-white text-xs sm:text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 mx-1 text-brand-light-blue fill-current" />
            <span>for creators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
