import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import { ChevronLeft, Leaf } from 'lucide-react';
import Reveal from '../../components/ui/Reveal/Reveal';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { PLACEHOLDER_IMG } from '../../utils';
import './AboutUs.scss';
import { API_BASE_URL, BASE_IMAGE_URL } from '../../config/env';


const API = API_BASE_URL;

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

        const res = await fetch(`${API_BASE_URL}/about-us`);
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
    return icon.startsWith('http') ? icon : `${BASE_IMAGE_URL}${icon}`;
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
          <OptimizedImage
            src={about.about_banner_image}
            alt={about.about_title || 'About Us'}
            className="about__hero-img"
            fallbackSrc={PLACEHOLDER_IMG}
            eager
            fetchPriority="high"
          />
        </section>
      )}

      <Container className="container-1500">

        {/* ── Intro Title + Description ── */}
          <Reveal as="section" type="fade-up" className="about__intro">
          {about.about_title && <h1 className="about__intro-title">{about.about_title}</h1>}
          {about.about_description && (
            <p className="about__intro-desc">{about.about_description}</p>
          )}
        </Reveal>

        {/* ── Mission Section (image collage) ── */}
        {(about.mission_image || about.vision_image || about.mission_title || about.mission_description) && (
        <Reveal as="section" type="fade-up" className="about__split">
            <div className="about__media-stack">
            {about.mission_image && (
                <div className="about__media-stack-item about__media-stack-item--back">
                <OptimizedImage
                  src={about.mission_image}
                  alt={about.mission_title || 'Our Mission'}
                  fallbackSrc={PLACEHOLDER_IMG}
                  wrapperStyle={{ width: '100%', height: '100%' }}
                />
                </div>
            )}
            {about.vision_image && (
                <div className="about__media-stack-item about__media-stack-item--front">
                <OptimizedImage
                  src={about.vision_image}
                  alt={about.vision_title || 'Our Vision'}
                  fallbackSrc={PLACEHOLDER_IMG}
                  wrapperStyle={{ width: '100%', height: '100%' }}
                />
                </div>
            )}
            </div>
            <div className="about__split-content">
            {about.mission_title && <h2>{about.mission_title}</h2>}
            {about.mission_description && <p>{about.mission_description}</p>}
            </div>
        </Reveal>
        )}

        {/* ── Vision Section (reversed layout) ── */}
        {(about.vision_image || about.vision_title || about.vision_description) && (
          <Reveal as="section" type="fade-up" className="about__split about__split--reverse">
            <div className="about__split-content">
              {about.vision_title && <h2>{about.vision_title}</h2>}
              {about.vision_description && <p>{about.vision_description}</p>}
            </div>
            {about.vision_image && (
              <div className="about__split-media about__split-media--framed">
                <OptimizedImage
                  src={about.vision_image}
                  alt={about.vision_title || 'Our Vision'}
                  fallbackSrc={PLACEHOLDER_IMG}
                  wrapperStyle={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
          </Reveal>
        )}

      </Container>

      {/* ── Core Values ── */}
      {(about.core_value_title || coreValues.length > 0) && (
        <section className="about__values">
          <Container className="container-1500">
            <Reveal type="fade-up" className="about__values-header">
              {about.core_value_title && <h2>{about.core_value_title}</h2>}
              {about.core_value_description && <p>{about.core_value_description}</p>}
            </Reveal>

            {coreValues.length > 0 && (
              <div className="about__values-grid">
                {coreValues.map((value, idx) => (
                  <Reveal key={value.id} type="fade-up" delay={(idx % 3) * 100} className="about__value-card">
                    <span className="about__value-icon">
                      {value.icon ? (
                        <OptimizedImage src={getIconUrl(value.icon)} alt={value.title} wrapperStyle={{ width: '26px', height: '26px', display: 'inline-block' }} />
                      ) : (
                        <Leaf size={26} strokeWidth={1.5} />
                      )}
                    </span>
                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </Reveal>
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