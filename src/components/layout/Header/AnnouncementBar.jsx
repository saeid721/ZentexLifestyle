import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/api';

// ─── Module-level cache for announcements ─────────────────────────
let _announcementsCache = null;
let _announcementsFetchPromise = null;

// ─── Announcement Top Bar ─────────────────────────────────────────
const AnnouncementBar = () => {
  const [messages, setMessages] = useState(() =>
    _announcementsCache ? _announcementsCache.map((a) => a.announcement) : []
  );

  useEffect(() => {
    if (_announcementsCache) {
      setMessages(_announcementsCache.map((a) => a.announcement));
      return;
    }

    if (_announcementsFetchPromise) {
      _announcementsFetchPromise.then((msgs) => setMessages(msgs));
      return;
    }

    _announcementsFetchPromise = apiGet('/announcement')
      .then((res) => {
        if (res.data?.status && Array.isArray(res.data.data)) {
          const sorted = [...res.data.data].sort(
            (a, b) => Number(a.sl_no) - Number(b.sl_no)
          );
          _announcementsCache = sorted;
          return sorted.map((a) => a.announcement);
        }
        _announcementsCache = [];
        return [];
      })
      .catch((err) => {
        console.error('Announcements error:', err);
        _announcementsCache = [];
        return [];
      })
      .finally(() => {
        _announcementsFetchPromise = null;
      });

    _announcementsFetchPromise.then((msgs) => setMessages(msgs));
  }, []);

  if (!messages.length) return null;

  if (messages.length === 1) {
    return (
      <div className="announcement-bar">
        <span className="announcement-bar__text">{messages[0]}</span>
      </div>
    );
  }

  return (
    <div className="announcement-bar">
      <div className="announcement-bar__track">
        {/* Duplicate for seamless loop */}
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="announcement-bar__slide">{msg}</span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;