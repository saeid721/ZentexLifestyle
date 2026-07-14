import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import { ChevronLeft, Leaf } from 'lucide-react';
import './AboutUs.scss';

const API_URL = 'https://admin.zentexlifestyle.softwaresale.xyz/api/about-us';
const ASSET_BASE = 'https://admin.zentexlifestyle.softwaresale.xyz/';

const AboutPage = () => {
  const [about, setAbout] = useState(null);
  const [coreValues, setCoreValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAbout = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to load About Us page');

        const json = await res.json();
        if (!json?.status) throw new Error(json?.message || 'Something went wrong');

        if (isMounted) {
          setAbout(json.data);
          setCoreValues(json.coreValues || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load About Us page');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAbout();
    return () => { isMounted = false; };
  }, []);

  const getIconUrl = (icon) => {
    if (!icon) return '';
    return icon.startsWith('http') ? icon : `${ASSET_BASE}${icon}`;
  };

  if (loading) {
    return (
      <main className="about about--loading">
        <Container className="container-1500 about__loading">
          <div className="spinner-border about__spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="about__loading-text">Loading About Us...</p>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="about about--error">
        <Container className="container-1500 py-5 text-center">
          <Alert variant="danger" className="d-inline-block">
            <Alert.Heading>⚠️ {error}</Alert.Heading>
            <p className="mb-0">
              <Link to="/" className="about__back-btn">
                <ChevronLeft size={14} strokeWidth={2} />
                Back To Home
              </Link>
            </p>
          </Alert>
        </Container>
      </main>
    );
  }

  if (!about) return null;

  return (
    <main className="about">

      {/* ── Hero Banner ───────────────────────────────── */}
      {about.about_banner_image && (
        <section className="about__hero">
          <img
            src={about.about_banner_image}
            alt={about.about_title || 'About Us'}
            className="about__hero-img"
            loading="eager"
          />
        </section>
      )}

      <Container className="container-1500">

        {/* ── Intro Title + Description ── */}
        <section className="about__intro">
          {about.about_title && <h1 className="about__intro-title">{about.about_title}</h1>}
          {about.about_description && (
            <p className="about__intro-desc">{about.about_description}</p>
          )}
        </section>

        {/* ── Mission Section (image collage) ── */}
        {(about.mission_image || about.vision_image || about.mission_title || about.mission_description) && (
        <section className="about__split">
            <div className="about__media-stack">
            {about.mission_image && (
                <div className="about__media-stack-item about__media-stack-item--back">
                <img src={about.mission_image} alt={about.mission_title || 'Our Mission'} />
                </div>
            )}
            {about.vision_image && (
                <div className="about__media-stack-item about__media-stack-item--front">
                <img src={about.vision_image} alt={about.vision_title || 'Our Vision'} />
                </div>
            )}
            </div>
            <div className="about__split-content">
            {about.mission_title && <h2>{about.mission_title}</h2>}
            {about.mission_description && <p>{about.mission_description}</p>}
            </div>
        </section>
        )}

        {/* ── Vision Section (reversed layout) ── */}
        {(about.vision_image || about.vision_title || about.vision_description) && (
          <section className="about__split about__split--reverse">
            <div className="about__split-content">
              {about.vision_title && <h2>{about.vision_title}</h2>}
              {about.vision_description && <p>{about.vision_description}</p>}
            </div>
            {about.vision_image && (
              <div className="about__split-media about__split-media--framed">
                <img src={about.vision_image} alt={about.vision_title || 'Our Vision'} />
              </div>
            )}
          </section>
        )}

      </Container>

      {/* ── Core Values ── */}
      {(about.core_value_title || coreValues.length > 0) && (
        <section className="about__values">
          <Container className="container-1500">
            <div className="about__values-header">
              {about.core_value_title && <h2>{about.core_value_title}</h2>}
              {about.core_value_description && <p>{about.core_value_description}</p>}
            </div>

            {coreValues.length > 0 && (
              <div className="about__values-grid">
                {coreValues.map((value) => (
                  <div className="about__value-card" key={value.id}>
                    <span className="about__value-icon">
                      {value.icon ? (
                        <img src={getIconUrl(value.icon)} alt={value.title} />
                      ) : (
                        <Leaf size={26} strokeWidth={1.5} />
                      )}
                    </span>
                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}
    </main>
  );
};

export default AboutPage;