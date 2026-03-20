/**
 * Example Component: Localized UI
 * Shows how to use the ContentContext hooks for translatable content
 */

'use client';

import React from 'react';
import { useTranslation, useContent } from '../contexts/ContentContext';
import { useDomain } from '../contexts/ConfigContext';

export function LocalizedUI() {
  const domain = useDomain();
  const { t, changeLanguage } = useTranslation();
  const { content, loading } = useContent();

  if (loading) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">
          {t('appName')}
        </h2>
        <p className="text-gray-600">{t('appDescription')}</p>
        <p className="text-lg font-semibold text-secondary mt-2">
          {t('tagline')}
        </p>
      </div>

      {/* Language Switcher */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-border">
        <p className="text-sm font-semibold mb-2">Change Language:</p>
        <div className="flex gap-2 flex-wrap">
          {['en', 'ta', 'te', 'hi', 'kn', 'ml'].map((lang) => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className="px-3 py-1 rounded bg-primary text-white hover:bg-primary-dark transition-fast"
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chat Placeholder */}
        <div className="p-4 bg-white rounded-lg border border-border">
          <p className="text-sm font-semibold mb-2 text-secondary">
            {t('placeholder')}
          </p>
          <input
            type="text"
            placeholder={t('placeholder')}
            className="w-full px-3 py-2 border border-border rounded"
            disabled
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white rounded-lg border border-border">
          <p className="text-sm font-semibold mb-2 text-secondary">
            Common Actions
          </p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark transition-fast">
              {t('send')}
            </button>
            <button className="px-3 py-1 bg-secondary text-white rounded hover:bg-secondary-dark transition-fast">
              {t('cancel')}
            </button>
            <button className="px-3 py-1 bg-accent text-gray-900 rounded hover:opacity-80 transition-fast">
              {t('save')}
            </button>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="p-4 bg-white rounded-lg border border-border">
          <p className="text-sm font-semibold mb-2 text-secondary">
            {t('voiceInput')}
          </p>
          <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-fast">
            {t('startListening')}
          </button>
        </div>

        {/* Domain-Specific Content */}
        <div className="p-4 bg-white rounded-lg border border-border">
          <p className="text-sm font-semibold mb-2 text-secondary">
            Domain: {domain}
          </p>
          <p className="text-sm text-gray-600">
            {domain === 'fitness' && t('workoutTips')}
            {domain === 'business' && t('marketingGuides')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border text-center text-xs text-gray-500">
        <p>{t('copyright')}</p>
        <div className="flex gap-4 justify-center mt-2">
          <a href="#" className="hover:text-primary">
            {t('privacy')}
          </a>
          <a href="#" className="hover:text-primary">
            {t('terms')}
          </a>
          <a href="#" className="hover:text-primary">
            {t('contactUs')}
          </a>
        </div>
      </div>
    </div>
  );
}

export default LocalizedUI;
