import React from 'react';
import { useTranslation } from 'react-i18next';
import "./Footer.css";
import { assets } from '../../assets/assets';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <h2>{t('footer.brand')}</h2>
          <p>{t('footer.about')}</p>
          <div className="footer-social-icons">
            <a href="https://facebook.com/yourprofile" target="_blank" rel="noopener noreferrer">
              <img src={assets.facebook_icon} alt="Facebook" loading="lazy" />
            </a>
            <a href="https://t.me/love_is_super" target="_blank" rel="noopener noreferrer">
              <img
                src={assets.telegram_icon || 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png'}
                alt="Telegram"
                loading="lazy"
              />
            </a>
            <a href="http://github.com/chapa-Et" target="_blank" rel="noopener noreferrer">
              <img
                src={assets.github_icon || 'https://cdn-icons-png.flaticon.com/512/733/733553.png'}
                alt="GitHub"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        <div className="footer-content-right">
          <h2>{t('footer.getInTouch')}</h2>
          <ul>
            <li>{t('footer.phone')}</li>
            <li>{t('footer.email')}</li>
          </ul>
        </div>
      </div>

      <hr />
      <p className="footer-copyright">{t('footer.copyright')}</p>
    </div>
  );
};

export default React.memo(Footer);