import {
  SITE_URL,
  WWW_HOST,
} from '../config/env';

export {
  SITE_URL,
  WWW_HOST,
  ADMIN_BASE_URL,
  BASE_IMAGE_URL,
  BASE_URL,
  API_BASE_URL,
  CALCULATE_API,
  TRACK_VISIT_URL,
  SCHEMA_ORG_URL,
  SCHEMA_ORG_IN_STOCK,
  WHATSAPP_BASE_URL,
  FACEBOOK_SHARE_URL,
  TWITTER_SHARE_URL,
  LINKEDIN_SHARE_URL,
  STITBD_URL,
  getSiteBaseUrl,
} from '../config/env';

export const formatPrice = (amount, currency = '৳') =>
  `${currency}${Number(amount).toLocaleString('en-US')}`;

export const PLACEHOLDER_IMG = new URL('../assets/images/placehold.jpg', import.meta.url).href;

export const SITE_NAME = 'Zentex';
export const PHONE = '+88 01846-139660';

if (typeof window !== 'undefined' && WWW_HOST && window.location.hostname === WWW_HOST) {
  window.location.replace(`${SITE_URL}${window.location.pathname}`);
}
