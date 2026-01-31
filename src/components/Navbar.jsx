import { useState } from 'react';
import { Leaf, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="bg-bone/95 backdrop-blur-sm sticky top-0 z-50 border-b border-sage/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <Leaf 
              className="w-8 h-8 text-sage group-hover:rotate-12 transition-transform duration-300" 
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="font-playfair text-xl md:text-2xl font-semibold text-charcoal leading-tight">
                Willow & Water
              </span>
              <span className="text-xs text-sage font-inter tracking-wider uppercase hidden sm:block">
                Organic Cleaning
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-inter text-charcoal hover:text-sage transition-colors duration-200 text-sm font-medium"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a href="#pricing" className="btn-primary text-sm">
              Book Now
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-charcoal hover:text-sage transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-sage/10">
            <ul className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 px-4 font-inter text-charcoal hover:text-sage hover:bg-sage/5 rounded-lg transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2 px-4">
                <a href="#pricing" className="btn-primary block text-center text-sm">
                  Book Now
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
