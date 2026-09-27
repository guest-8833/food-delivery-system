import React, { useState, useContext, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StoreContext } from '../../context/StoreContext.jsx';
import { assets } from "../../assets/assets.js";
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import "./Navbar.css";

const Navbar = ({ setShowLogin }) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const {
    getTotalCartItems,
    token,
    setToken,
    favoriteCount = 0,
    searchTerm,
    setSearchTerm,
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const location = useLocation();
  const inlineSearchRef = useRef(null);
  const inlineWrapperRef = useRef(null);
  const profileRef = useRef(null);

  const cartItemCount = getTotalCartItems();
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchExpanded && inlineSearchRef.current) inlineSearchRef.current.focus();
  }, [searchExpanded]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (searchExpanded) {
          setSearchExpanded(false);
          setSearchTerm('');
        }
        if (profileOpen) setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [searchExpanded, profileOpen, setSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchExpanded && inlineWrapperRef.current && !inlineWrapperRef.current.contains(e.target)) {
        setSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchExpanded]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
    setProfileOpen(false);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  /* ---------- Home ---------- */
  const handleHomeClick = useCallback((e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      scrollToTop();
    } else {
      navigate('/');
      setTimeout(scrollToTop, 100);
    }
    closeMobileMenu();
  }, [location.pathname, navigate]);

  /* ---------- Anchor links (#app-download, #footer) ---------- */
  const handleAnchorClick = useCallback((e, anchorId) => {
    if (e) e.preventDefault();
    const scroll = () => {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scroll, 200);
    } else {
      scroll();
    }
    closeMobileMenu();
  }, [location.pathname, navigate]);

  /* ---------- Search: filter Home page in place ---------- */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Close the inline input
    setSearchExpanded(false);

    // If not on the home page, go there first
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('food-display')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    } else {
      document.getElementById('food-display')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchIconClick = () => {
    if (searchExpanded) {
      // collapsing
      setSearchExpanded(false);
    } else {
      setSearchExpanded(true);
    }
  };

  const clearSearch = () => setSearchTerm('');

  /* ---------- Nav links ---------- */
  const navLinks = useMemo(() => [
    { to: "/", label: t('nav.home'), onClick: handleHomeClick },
    { to: "/favorites", label: t('nav.favorites', 'Favorites') },
    {
      label: t('nav.mobileApp', 'Mobile App'),
      onClick: (e) => handleAnchorClick(e, 'app-download'),
      href: "#app-download",
    },
    {
      label: t('nav.contactUs', 'Contact Us'),
      onClick: (e) => handleAnchorClick(e, 'footer'),
      href: "#footer",
    },
  ], [t, handleHomeClick, handleAnchorClick]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">

        <Link to="/" className="nav-logo" onClick={handleHomeClick}>
          <span className="logo-text">Zengena</span>
          <span className="logo-dot">🍕</span>
        </Link>

        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link, index) => (
            link.to ? (
              <Link
                key={index}
                to={link.to}
                className={isActive(link.to) ? 'active' : ''}
                onClick={link.onClick || closeMobileMenu}
              >
                {link.label}
              </Link>
            ) : (
              <a key={index} href={link.href} onClick={link.onClick}>
                {link.label}
              </a>
            )
          ))}
        </div>

        <div className="nav-actions">

          <LanguageSwitcher />

          <div
            className={`inline-search-wrapper ${searchExpanded ? 'expanded' : ''}`}
            ref={inlineWrapperRef}
          >
            <form onSubmit={handleSearchSubmit} className="inline-search-form">
              <input
                ref={inlineSearchRef}
                type="text"
                placeholder={t('nav.searchFood', 'Search food...')}
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="inline-search-input"
                tabIndex={searchExpanded ? 0 : -1}
              />
              {searchExpanded && searchTerm && (
                <button
                  type="button"
                  className="inline-search-clear"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </form>
            <button
              type="button"
              className={`action-btn search-btn ${searchExpanded ? 'active' : ''}`}
              onClick={handleSearchIconClick}
              aria-label="Search"
            >
              <img src={assets.search_icon} alt="" />
              <span className="search-ripple" />
            </button>
          </div>

        
          
          

          <Link to="/cart" className="action-btn cart-btn" aria-label={t('nav.cart')}>
            <img src={assets.basket_icon} alt="" />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount > 9 ? '9+' : cartItemCount}</span>
            )}
          </Link>

          {!token ? (
            <button className="signin-btn" onClick={() => setShowLogin(true)}>
              {t('nav.login')}
            </button>
          ) : (
            <div className="profile-dropdown" ref={profileRef}>
              <button
                className={`profile-btn ${profileOpen ? 'open' : ''}`}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Profile"
              >
                <img src={assets.profile_icon} alt="" />
              </button>
              <div className={`dropdown-menu ${profileOpen ? 'open' : ''}`}>
                {/* ✅ Duplicate heart removed — nav already has one */}
                <Link to="/myorders" onClick={() => { closeMobileMenu(); setProfileOpen(false); }}>
                  <img src={assets.bag_icon} alt="" />
                  {t('nav.myOrders')}
                </Link>
                <hr />
                <button onClick={handleLogout}>
                  <img src={assets.logout_icon} alt="" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);