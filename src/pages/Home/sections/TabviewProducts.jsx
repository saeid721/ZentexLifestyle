import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import SectionHeader from '../../../components/ui/SectionHeader/SectionHeader';
import ProductGrid from '../../../components/ui/ProductGrid/ProductGrid';
import { apiGet } from '../../../utils/api';
import './TabviewProducts.scss';

const TABS = [
  { key: 'new_arrival', label: 'New Arrivals' },
  { key: 'pre_order',   label: 'Pre Order' },
];

const TabviewProducts = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiGet(`/products/tabbed?type=${activeTab}&page=1&per_page=10`)
      .then((res) => {
        if (!cancelled && res.data?.data) setProducts(res.data.data);
      })
      .catch((err) => console.error('[TabviewProducts]', err))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <section className="section-wrapper tabview-products">
      <Container className="container-1500">

        <div className="tabview-products__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tabview-products__tab${
                activeTab === tab.key ? ' tabview-products__tab--active' : ''
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ProductGrid products={products} loading={loading} cols={4} />
      </Container>
    </section>
  );
};

export default TabviewProducts;