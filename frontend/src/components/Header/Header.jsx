import React from 'react';
import { useTranslation } from 'react-i18next';
import "./Header.css";

const Header = () => {
    const { t } = useTranslation();

    return (
        <div className='header'>
            <div className="header-contents">
                <h2>{t('header.title')}</h2>
                <p>{t('header.subtitle')}</p>
                <button onClick={() => document.getElementById('food-display')?.scrollIntoView({ behavior: 'smooth' })}>
                    {t('header.cta')}
                </button>
            </div>
        </div>
    );
};

export default React.memo(Header);
