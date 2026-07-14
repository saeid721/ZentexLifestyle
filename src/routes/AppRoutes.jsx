import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header/Header';
import HomePage from '../pages/Home/HomePage';

const Footer = lazy(() => import('../components/layout/Footer/Footer'));
const CategoriesMobilePage = lazy(() => import('../pages/CategoryPage/CategoriesPage'));
const NewArrivalsPage = lazy(() => import('../pages/CategoryPage/NewArrivalsPage'));
const ProductDetails = lazy(() => import('../pages/ProductDetails/ProductDetailsPage'));
const CatagoryProductPage = lazy(() => import('../pages/CategoryPage/CatagoryProductPage'));
const SubCategories = lazy(() => import('../components/ui/SubCategory/SubCategories'));
const CartPage = lazy(() => import('../pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('../pages/Checkout/CheckoutPage'));
const InvoicePage = lazy(() => import('../pages/Checkout/InvoicePage'));
const RegisterPage = lazy(() => import('../pages/Account/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/Account/ForgotPasswordPage'));
const CustomerDashboardPage = lazy(() => import('../pages/Account/CustomerDashboardPage'));
const PageDetailPage = lazy(() => import('../pages/CompanyPage/PageDetailPage'));
const ContactPage = lazy(() => import('../pages/Contact/ContactPage'));
const SearchResultsPage = lazy(() => import('../pages/SearchResults/SearchResultsPage'));
const WishlistPage = lazy(() => import('../pages/WishlistPage/WishlistPage'));
const ShopPage = lazy(() => import('../pages/ShopPage/ShopPage'));
const AboutPage = lazy(() => import('../pages/AboutPage/AboutPage'));
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'));

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner-border" style={{ color: '#FF6503' }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 2200));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = schedule(() => setShowFooter(true), { timeout: 3500 });
    return () => cancel(id);
  }, []);

  return (
    <>
      <Header />
      <Suspense fallback={<PageLoader />}>
        <div style={{ width: '100%' }}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/category" element={<CategoriesMobilePage />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/products/:catSlug" element={<CatagoryProductPage />} />
            <Route path="/categories/:catSlug/:subSlug" element={<CatagoryProductPage />} />
            <Route path="/categories/:catSlug" element={<SubCategories />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/invoice/:orderId" element={<InvoicePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/my-account" element={<CustomerDashboardPage />} />
            <Route path="/page/:slug" element={<PageDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Suspense>
      {showFooter && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  );
};

export default AppRoutes;