// src/hooks/useGeneralSettings.js
import { useState, useEffect } from 'react';
import { apiGet } from '../utils/api';

// Social icon title → local icon mapping
// API gives Font Awesome class names, but Footer uses local PNG icons
// So we map by title (case-insensitive)
const ICON_MAP = {
  facebook:  'fb',
  instagram: 'ig',
  linkedin:  'li',
  tiktok:    'tt',
  youtube:   'yt',
  whatsapp:  'wa',
  twitter:   'tw',
};

let generalSettingsCache = null;
let generalSettingsPromise = null;

const mapGeneralSettingsResponse = (body) => {
  if (!body?.success) {
    return {
      settings: null,
      contact: null,
      socials: [],
    };
  }

  const d = body.data || {};

  return {
    settings: d.data || null,
    contact: d.contact || null,
    socials: (d.socials || [])
      .filter((s) => s.status === 1)
      .map((s) => ({
        href: s.link,
        title: s.title,
        key: ICON_MAP[s.title?.toLowerCase()] || 'fb',
        color: s.color || '#333',
      })),
  };
};

export const useGeneralSettings = () => {
  const [settings, setSettings] = useState(generalSettingsCache?.settings || null); // data.data
  const [contact,  setContact]  = useState(generalSettingsCache?.contact || null);  // data.contact
  const [socials,  setSocials]  = useState(generalSettingsCache?.socials || []);    // data.socials[]
  const [loading,  setLoading]  = useState(!generalSettingsCache);

  useEffect(() => {
    if (generalSettingsCache) {
      setSettings(generalSettingsCache.settings);
      setContact(generalSettingsCache.contact);
      setSocials(generalSettingsCache.socials);
      setLoading(false);
      return;
    }

    if (!generalSettingsPromise) {
      generalSettingsPromise = apiGet('/general-settings')
        .then((res) => {
          const normalized = mapGeneralSettingsResponse(res.data);
          generalSettingsCache = normalized;
          return normalized;
        })
        .catch((err) => {
          console.error('[useGeneralSettings]', err);
          return {
            settings: null,
            contact: null,
            socials: [],
          };
        })
        .finally(() => {
          generalSettingsPromise = null;
        });
    }

    generalSettingsPromise
      .then((normalized) => {
        setSettings(normalized.settings);
        setContact(normalized.contact);
        setSocials(normalized.socials);
      })
      .finally(() => setLoading(false));
  }, []);

  return { settings, contact, socials, loading };
};
