/**
 * Example Component: Domain Configuration Display
 * Shows how to use the ConfigContext hooks throughout the app
 */

'use client';

import React from 'react';
import {
  useDomainConfig,
  useBranding,
  useFeatureEnabled,
  useDomain,
  useBrandingValue,
} from '../contexts/ConfigContext';

export function DomainConfigDisplay() {
  const { config, loading } = useDomainConfig();
  const branding = useBranding();
  const domain = useDomain();
  const voiceInputEnabled = useFeatureEnabled('voiceInput');
  const primaryColor = useBrandingValue('primaryColor');

  if (loading) {
    return <div className="p-4 text-center">Loading configuration...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Domain Configuration</h2>

      {/* Domain Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Domain Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Domain ID</p>
            <p className="font-mono text-lg">{domain}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Brand Name</p>
            <p className="font-mono text-lg">{branding.brandName}</p>
          </div>
        </div>
      </div>

      {/* Branding Colors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Branding Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Primary</p>
            <div
              className="w-full h-20 rounded border"
              style={{ backgroundColor: branding.primaryColor }}
            />
            <p className="text-xs text-gray-500 mt-1">{branding.primaryColor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Secondary</p>
            <div
              className="w-full h-20 rounded border"
              style={{ backgroundColor: branding.secondaryColor }}
            />
            <p className="text-xs text-gray-500 mt-1">{branding.secondaryColor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Accent</p>
            <div
              className="w-full h-20 rounded border"
              style={{ backgroundColor: branding.accentColor }}
            />
            <p className="text-xs text-gray-500 mt-1">{branding.accentColor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Text</p>
            <div
              className="w-full h-20 rounded border"
              style={{ backgroundColor: branding.textColor }}
            />
            <p className="text-xs text-gray-500 mt-1">{branding.textColor}</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Feature Flags</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(config.features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-sm">
                {feature}: {enabled ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Example Usage */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Example Usage</h3>
        <div className="bg-gray-100 p-4 rounded text-sm font-mono">
          <p>voiceInputEnabled: {voiceInputEnabled ? 'true' : 'false'}</p>
          <p>primaryColor: {primaryColor}</p>
        </div>
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Supported Languages</h3>
        <div className="flex flex-wrap gap-2">
          {config.businessLogic.supportedLanguages.map((lang) => (
            <span
              key={lang}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DomainConfigDisplay;
