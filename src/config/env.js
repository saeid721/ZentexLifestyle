const stripTrailingSlash = (value) => (value || '').trim().replace(/\/+$/, '');

const ensureTrailingSlash = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

const toApiBaseUrl = (value) => {
  const normalized = stripTrailingSlash(value);
  if (!normalized) return '';
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawAdminUrl = import.meta.env.VITE_ADMIN_BASE_URL;
const rawSiteUrl = import.meta.env.VITE_SITE_URL || import.meta.env.VITE_API_BASE_URL;

export const SITE_URL = stripTrailingSlash(rawSiteUrl);
export const WWW_HOST = (import.meta.env.VITE_WWW_HOST || '').trim();

export const ADMIN_BASE_URL = ensureTrailingSlash(
  rawAdminUrl || `${stripTrailingSlash(rawApiUrl).replace(/\/api$/i, '')}/`,
);

export const API_BASE_URL = toApiBaseUrl(rawApiUrl);

export const BASE_IMAGE_URL = ADMIN_BASE_URL;
export const BASE_URL = ADMIN_BASE_URL;
export const CALCULATE_API = `${API_BASE_URL}/cart/calculate`;
export const TRACK_VISIT_URL = `${API_BASE_URL}/track-visit`;

export const SCHEMA_ORG_URL = (import.meta.env.VITE_SCHEMA_ORG_URL || '').trim();
export const SCHEMA_ORG_IN_STOCK = `${SCHEMA_ORG_URL}/InStock`;

export const WHATSAPP_BASE_URL = (import.meta.env.VITE_WHATSAPP_BASE_URL || '').trim();
export const FACEBOOK_SHARE_URL = (import.meta.env.VITE_FACEBOOK_SHARE_URL || '').trim();
export const TWITTER_SHARE_URL = (import.meta.env.VITE_TWITTER_SHARE_URL || '').trim();
export const LINKEDIN_SHARE_URL = (import.meta.env.VITE_LINKEDIN_SHARE_URL || '').trim();
export const STITBD_URL = (import.meta.env.VITE_STITBD_URL || '').trim();

export const GOOGLE_FONTS_PRECONNECT_URL = (import.meta.env.VITE_GOOGLE_FONTS_PRECONNECT_URL || '').trim();
export const GOOGLE_FONTS_STATIC_URL = (import.meta.env.VITE_GOOGLE_FONTS_STATIC_URL || '').trim();
export const GOOGLE_FONTS_PLUS_JAKARTA_URL = (import.meta.env.VITE_GOOGLE_FONTS_PLUS_JAKARTA_URL || '').trim();
export const GOOGLE_FONTS_NOTO_URL = (import.meta.env.VITE_GOOGLE_FONTS_NOTO_URL || '').trim();

export const getSiteBaseUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : SITE_URL;
