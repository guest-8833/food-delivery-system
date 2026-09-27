import React from 'react'
import { useTranslation } from 'react-i18next'
import './Navbar.css'
import { assets } from '../../assets/assets'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'

const Navbar = ({ onLogout }) => {
  const { t } = useTranslation();

  return (
    <div className='navbar'>
      <h2 className="admin-title"> Welcome Admin Panel</h2>
      <div className="navbar-right">
        <LanguageSwitcher />
        <img className='profile' src={assets.profile_image} alt="Profile" />
        {onLogout && (
          <button className="logout-btn" onClick={onLogout}>{t('common.logout')}</button>
        )}
      </div>
    </div>
  )
}

export default Navbar
