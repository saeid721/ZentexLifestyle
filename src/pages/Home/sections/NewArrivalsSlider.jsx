// import React, { useRef, useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Autoplay } from 'swiper/modules';
// import { PLACEHOLDER_IMG, BASE_IMAGE_URL } from '../../../utils';
// import { ChevronLeft, ChevronRight } from 'lucide-react';
// import 'swiper/css';
// import '../../../components/ui/Skeleton/Skeleton.css';
// import './NewArrivalsSlider.scss';

// // ── Screen size অনুযায়ী কতটা card দেখাবে ──────────────────────
// const getSkeletonCount = () => {
//   const w = window.innerWidth;
//   if (w >= 1280) return 6;
//   if (w >= 768)  return 4;
//   return 2;
// };

// // ── Skeleton Card — real na-card এর same structure ──────────────
// const NaSkeletonCard = ({ delay = 0 }) => (
//   <div className="na-card" style={{ pointerEvents: 'none' }}>
//     <div className="na-card__img-wrap">
//       <div
//         className="sk"
//         style={{
//           width: '100%',
//           aspectRatio: '1 / 1',
//           borderRadius: 'inherit',
//           animationDelay: `${delay}s`,
//         }}
//       />
//     </div>
//     <div className="na-card__info">
//       <div
//         className="sk sk-line"
//         style={{ width: '75%', marginBottom: 6, animationDelay: `${delay}s` }}
//       />
//       <div
//         className="sk sk-line-lg"
//         style={{ width: '45%', animationDelay: `${delay}s` }}
//       />
//     </div>
//   </div>
// );

// const NewArrivalsSlider = ({
//   title       = 'NEW ARRIVAL',
//   viewAllLink = '/new-arrivals',
//   products    = [],
//   loading     = false,
// }) => {
//   const prevRef = useRef(null);
//   const nextRef = useRef(null);
//   const swiperRef = useRef(null);

//   // ── Responsive skeleton count ────────────────────────────────
//   const [skeletonCount, setSkeletonCount] = useState(getSkeletonCount);

//   useEffect(() => {
//     const handleResize = () => setSkeletonCount(getSkeletonCount());
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const handlePrev = useCallback(() => {
//     swiperRef.current?.swiper?.slidePrev();
//   }, []);

//   const handleNext = useCallback(() => {
//     swiperRef.current?.swiper?.slideNext();
//   }, []);

//   // ── Skeleton UI ──────────────────────────────────────────────
//   if (loading) {
//     return (
//       <section className="na">
//         <div className="na__head">
//           <h2 className="na__title">{title}</h2>
//           <Link to={viewAllLink} className="na__view-all">View All</Link>
//         </div>
//         <div className="na__slider-wrap">
//           <div
//             style={{
//               display: 'flex',
//               gap: 10,
//               overflow: 'hidden',
//               padding: '0 4px',
//             }}
//           >
//             {Array.from({ length: skeletonCount }).map((_, i) => (
//               <div
//                 key={i}
//                 style={{ flex: `0 0 calc(${100 / skeletonCount}% - 10px)` }}
//               >
//                 <NaSkeletonCard delay={i * 0.12} />
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     );
//   }

//   // ── Real Slider ──────────────────────────────────────────────
//   return (
//     <section className="na">
//       <div className="na__head">
//         <h2 className="na__title">{title}</h2>
//         <Link to={viewAllLink} className="na__view-all">View All</Link>
//       </div>

//       <div className="na__slider-wrap">
//         <button ref={prevRef} className="na__nav na__nav--prev" onClick={handlePrev} aria-label="Previous">
//           <ChevronLeft size={14} strokeWidth={2} />
//         </button>

//         <button ref={nextRef} className="na__nav na__nav--next" onClick={handleNext} aria-label="Next">
//           <ChevronRight size={14} strokeWidth={2} />
//         </button>

//         <Swiper
//           ref={swiperRef}
//           modules={[Autoplay]}
//           autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
//           loop={products.length > 2}
//           speed={650}
//           spaceBetween={10}
//           slidesPerView={2}
//           centeredSlides={false}
//           breakpoints={{
//             768:  { slidesPerView: 3.4, centeredSlides: true, spaceBetween: 10 },
//             1280: { slidesPerView: 5.4, centeredSlides: true, spaceBetween: 10 },
//           }}
//           className="na__swiper"
//         >
//           {products.map((product) => (
//             <SwiperSlide key={product.id}>
//               <NaCard product={product} />
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       </div>
//     </section>
//   );
// };

// /* ── Real Card ───────────────────────────────────────────────────────────── */
// const NaCard = ({ product }) => {
//   const { name, new_price, image, images } = product;
//   const isPreOrder = !!product.pre_order_status;

//   const slug =
//     product.slug ||
//     product.product_slug ||
//     product.product_code ||
//     null;

//   const img1 = image ? BASE_IMAGE_URL + image : (images?.[0] || PLACEHOLDER_IMG);
//   const img2 = images?.[1] ? BASE_IMAGE_URL + images[1] : null;

//   const isStockOut = Boolean(product?.stock_out || product?.is_stock_out || product?.stock === 0);

//   if (!slug) return null;

//   return (
//     <Link to={`/product/${slug}`} className="na-card" aria-label={name}>
//       <div className="na-card__img-wrap">
//         <img
//           src={img1}
//           alt={name}
//           className={`na-card__img na-card__img--main${img2 ? ' has-hover' : ''}`}
//           loading="lazy"
//           decoding="async"
//           onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
//         />
//         {img2 && (
//           <img
//             src={img2}
//             alt={name}
//             className="na-card__img na-card__img--alt"
//             loading="lazy"
//             decoding="async"
//             onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
//           />
//         )}
//         {isPreOrder ? (
//           <span className="na-card__badge na-card__badge--preorder">PRE ORDER</span>
//         ) : (
//           <>
//             <span className="na-card__badge">NEW</span>
//             {isStockOut && (
//               <span className="na-card__badge na-card__badge--stockout">Stock Out</span>
//             )}
//           </>
//         )}
//       </div>
//       <div className="na-card__info">
//         <p className="na-card__name">{name}</p>
//         <p className="na-card__price">Tk. {Number(new_price).toLocaleString('en-BD')}</p>
//       </div>
//     </Link>
//   );
// };

// export default NewArrivalsSlider;