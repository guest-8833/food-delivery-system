import React from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "am", label: "አማ" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChange = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="admin-language-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`admin-language-option ${i18n.language === lang.code ? "admin-language-option-active" : ""}`}
          onClick={() => handleChange(lang.code)}
          aria-label={`Switch to ${lang.code === "en" ? "English" : "Amharic"}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
