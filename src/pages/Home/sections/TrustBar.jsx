import React from 'react';
import { Container } from 'react-bootstrap';
import Reveal from '../../../components/ui/Reveal/Reveal';
import './TrustBar.scss';

const ICON_MAP = {
  'fas fa-truck':        '🚚',
  'fas fa-exchange-alt': '🔄',
  'fas fa-lock':         '🔒',
  'fas fa-headphones':   '🎧',
};

const getIcon = (iconClass) => ICON_MAP[iconClass] ?? '✅';

const TrustBar = ({ features = [] }) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div className="trust-bar">
      <Container className="container-1500">
        <div className="trust-bar__grid">
          {features.map((f, idx) => (
            <Reveal key={f.id} type="fade-up" delay={idx * 90} className="trust-bar__card">
              <span className="trust-bar__icon">{getIcon(f.icon)}</span>
              <div className="trust-bar__text">
                <p className="trust-bar__title">{f.title}</p>
                <p className="trust-bar__sub">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default TrustBar;