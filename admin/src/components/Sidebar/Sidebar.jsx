import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/add' className="sidebar-option">
          <img src={assets.add_icon} alt="" />
          <p>{t('sidebar.addItem')}</p>
        </NavLink>

        <NavLink to='/list' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>{t('sidebar.listItems')}</p>
        </NavLink>

        <NavLink to='/orders' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>{t('sidebar.orders')}</p>
        </NavLink>

        <NavLink to='/daily-report' className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>{t('sidebar.dailyReport')}</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
