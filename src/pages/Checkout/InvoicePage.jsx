import React, { useState, useEffect, useRef } from 'react';
import { Container, Spinner, Modal } from 'react-bootstrap';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { formatPrice, PLACEHOLDER_IMG } from '../../utils';
import fallbackLogo from '../../assets/images/logo.png';
import './CheckoutPage.scss';

// ── API endpoints ─────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_IMAGE_URL = import.meta.env.VITE_SITE_URL || '';

const INVOICE_API = `${API_BASE_URL}/orders/invoice`;
const SETTINGS_API = `${API_BASE_URL}/general-settings`;

// ── Utilities ─────────────────────────────────────────────────────────────────

function waitForStylesReady() {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const linkWaits = links.map(
        (link) =>
            new Promise((resolve) => {
                if (link.sheet) {
                    resolve();
                    return;
                }
                const done = () => resolve();
                link.addEventListener('load', done, { once: true });
                link.addEventListener('error', done, { once: true });
                setTimeout(done, 4000);
            }),
    );

    return Promise.all(linkWaits).then(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    });
}

async function collectDocumentStylesForPrint() {
    await waitForStylesReady();

    const chunks = new Set();
    const pending = [];

    document.querySelectorAll('style').forEach((tag) => {
        const text = tag.textContent?.trim();
        if (text) chunks.add(text);
    });

    const fetchCss = (href) =>
        fetch(href)
            .then((res) => (res.ok ? res.text() : ''))
            .then((text) => { if (text?.trim()) chunks.add(text); })
            .catch(() => { });

    for (const sheet of Array.from(document.styleSheets)) {
        try {
            if (sheet.cssRules?.length) {
                const text = Array.from(sheet.cssRules)
                    .map((r) => r.cssText)
                    .join('\n');
                if (text.trim()) chunks.add(text);
            }
        } catch {
            /* cross-origin — fetch href below */
        }
        if (sheet.href) pending.push(fetchCss(sheet.href));
    }

    document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
        pending.push(fetchCss(link.href));
    });

    await Promise.all(pending);
    return Array.from(chunks)
        .join('\n')
        .replace(/<\/style/gi, '<\\/style');
}

function buildInvoicePrintHtml(invoiceHtml, inlinedCss, invoiceNo) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice-${invoiceNo || 'order'}</title>
  <style>
    ${inlinedCss}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 16px; background: #fff; }
    .invoice-action-bar, .no-print { display: none !important; }
    .invoice-print-container { max-width: 100% !important; padding: 0 !important; }
    .invoice-doc { box-shadow: none !important; border-radius: 8px !important; padding: 24px !important; }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      body { padding: 0; }
      .invoice-doc { padding: 0 !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body>
  ${invoiceHtml}
</body>
</html>`;
}

function schedulePrintWhenReady(targetWindow, delayMs = 700) {
    const runPrint = () => {
        const doc = targetWindow.document;
        const imgs = Array.from(doc.images || []);
        const afterImages = () => {
            try {
                targetWindow.focus();
            } catch {
                /* cross-origin or detached */
            }
            setTimeout(() => {
                try {
                    targetWindow.print();
                } catch {
                    /* fallback below */
                }
            }, delayMs);
        };
        if (!imgs.length) {
            afterImages();
            return;
        }
        let done = 0;
        const tick = () => {
            done += 1;
            if (done >= imgs.length) afterImages();
        };
        imgs.forEach((img) => {
            if (img.complete) tick();
            else {
                img.onload = tick;
                img.onerror = tick;
            }
        });
    };

    if (targetWindow.document.readyState === 'complete') runPrint();
    else targetWindow.addEventListener('load', runPrint, { once: true });
}

function createSyncPrintTarget() {
    const popup = window.open('about:blank', '_blank');
    if (popup) {
        try {
            popup.document.open();
            popup.document.write(
                '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Invoice</title></head><body style="font-family:sans-serif;padding:24px;color:#555;">Preparing invoice…</body></html>',
            );
            popup.document.close();
        } catch {
            /* ignore */
        }
        return { kind: 'popup', win: popup, cleanup: null };
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Invoice PDF');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
        'position:fixed;left:0;top:0;width:100%;height:100%;border:0;z-index:2147483646;background:#fff;opacity:0.01;pointer-events:none;';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    if (!win) {
        iframe.remove();
        return null;
    }

    try {
        win.document.open();
        win.document.write(
            '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Invoice</title></head><body style="font-family:sans-serif;padding:24px;color:#555;">Preparing invoice…</body></html>',
        );
        win.document.close();
    } catch {
        iframe.remove();
        return null;
    }

    const cleanup = () => {
        setTimeout(() => {
            try {
                iframe.remove();
            } catch {
                /* already removed */
            }
        }, 120000);
    };

    return { kind: 'iframe', win, cleanup };
}

function writeHtmlToPrintTarget(target, html) {
    target.win.document.open();
    target.win.document.write(html);
    target.win.document.close();
    schedulePrintWhenReady(target.win, target.kind === 'iframe' ? 900 : 700);
    target.cleanup?.();
}

function openBlobInvoiceOnMobile(blobUrl) {
    const opened = window.open(blobUrl, '_blank');
    if (!opened) {
        window.location.assign(blobUrl);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

function isMobileBrowser() {
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return true;
    }
    return (
        navigator.maxTouchPoints > 0
        && window.matchMedia?.('(max-width: 768px)').matches === true
    );
}

function isIOSDevice() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function isAndroidDevice() {
    return /Android/i.test(navigator.userAgent || '');
}

async function requestMobileStoragePermission() {
    try {
        if (navigator.storage?.persist) {
            const already = await navigator.storage.persisted?.();
            if (!already) await navigator.storage.persist();
        }
    } catch {
        /* not supported — downloads still work without it */
    }
    return true;
}

async function trySaveWithFilePicker(blob, filename) {
    if (typeof window.showSaveFilePicker !== 'function') return false;
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
    } catch (err) {
        if (err?.name === 'AbortError') return true;
        return false;
    }
}

function tryAnchorDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        a.setAttribute('target', '_self');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 120000);
        return true;
    } catch {
        URL.revokeObjectURL(url);
        return false;
    }
}

async function tryWebShareFile(blob, filename) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (typeof navigator.share !== 'function' || !navigator.canShare?.({ files: [file] })) {
        return false;
    }
    try {
        await navigator.share({ files: [file], title: filename });
        return true;
    } catch (err) {
        if (err?.name === 'AbortError') return true;
        return false;
    }
}

function openPdfInNewTab(blob) {
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank');
    if (!opened) window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 120000);
}

async function savePdfBlob(blob, filename) {
    void requestMobileStoragePermission();

    if (await trySaveWithFilePicker(blob, filename)) return;

    if (isAndroidDevice()) {
        tryAnchorDownload(blob, filename);
        return;
    }

    if (tryAnchorDownload(blob, filename) && !isIOSDevice()) return;

    if (isIOSDevice() && (await tryWebShareFile(blob, filename))) return;

    if (isIOSDevice()) {
        openPdfInNewTab(blob);
        return;
    }

    tryAnchorDownload(blob, filename);
}

async function inlineInvoiceImages(root) {
    const imgs = root.querySelectorAll('img');
    await Promise.all(
        Array.from(imgs).map(
            (img) =>
                new Promise((resolve) => {
                    if (!img.src || img.src.startsWith('data:')) {
                        resolve();
                        return;
                    }
                    const url = img.src;
                    const tester = new Image();
                    tester.crossOrigin = 'anonymous';
                    tester.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = tester.naturalWidth;
                            canvas.height = tester.naturalHeight;
                            canvas.getContext('2d').drawImage(tester, 0, 0);
                            img.src = canvas.toDataURL('image/png');
                        } catch {
                            /* CORS — keep remote src */
                        }
                        resolve();
                    };
                    tester.onerror = () => resolve();
                    tester.src = url;
                }),
        ),
    );
}

function createPdfCaptureClone(rootEl) {
    const clone = rootEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('invoice-doc--pdf');
    clone.style.width = '860px';
    clone.style.maxWidth = '860px';
    clone.style.minWidth = '860px';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '860px';
    wrapper.style.minWidth = '860px';
    wrapper.style.height = 'auto';
    wrapper.style.overflow = 'hidden';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.opacity = '0';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    return { clone, wrapper };
}

let html2pdfModule = null;

async function getHtml2Pdf() {
    if (!html2pdfModule) {
        html2pdfModule = (await import('html2pdf.js')).default;
    }
    return html2pdfModule;
}

function invoicePdfFilename(invoiceNo) {
    return `invoice-${invoiceNo || 'order'}.pdf`;
}

function getInvoicePdfOptions(captureEl, filename) {
    return {
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            scrollX: 0,
            scrollY: 0,
            width: captureEl.scrollWidth,
            height: captureEl.scrollHeight,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
    };
}

async function buildInvoicePdfBlob(rootEl, invoiceNo) {
    const html2pdf = await getHtml2Pdf();
    const originalCaptureEl = rootEl.querySelector('.invoice-doc') || rootEl;
    const { clone: captureEl, wrapper } = createPdfCaptureClone(originalCaptureEl);

    try {
        await waitForStylesReady();
        if (document.fonts?.ready) await document.fonts.ready;
        await inlineInvoiceImages(captureEl);
        await new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        const filename = invoicePdfFilename(invoiceNo);
        const opt = getInvoicePdfOptions(captureEl, filename);
        return await html2pdf().set(opt).from(captureEl).outputPdf('blob');
    } finally {
        try {
            wrapper.remove();
        } catch {
            // ignore cleanup issues
        }
    }
}

function startInvoicePdfPrepare(rootEl, invoiceNo, cacheRef, promiseRef) {
    if (promiseRef.current) return promiseRef.current;

    cacheRef.current = { blob: null, filename: invoicePdfFilename(invoiceNo), ready: false };

    promiseRef.current = (async () => {
        try {
            const blob = await buildInvoicePdfBlob(rootEl, invoiceNo);
            cacheRef.current = {
                blob,
                filename: invoicePdfFilename(invoiceNo),
                ready: true,
            };
            return cacheRef.current;
        } catch (err) {
            cacheRef.current = { blob: null, filename: invoicePdfFilename(invoiceNo), ready: false };
            promiseRef.current = null;
            throw err;
        }
    })();

    return promiseRef.current;
}

async function downloadInvoicePdfFile(rootEl, invoiceNo, cacheRef, promiseRef) {
    const filename = invoicePdfFilename(invoiceNo);

    if (cacheRef.current?.ready && cacheRef.current.blob) {
        await savePdfBlob(cacheRef.current.blob, cacheRef.current.filename || filename);
        return;
    }

    const prepared = await (promiseRef.current || startInvoicePdfPrepare(rootEl, invoiceNo, cacheRef, promiseRef));
    if (prepared?.blob) {
        await savePdfBlob(prepared.blob, prepared.filename || filename);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  InvoicePage Component
// ══════════════════════════════════════════════════════════════════════════════
export const InvoicePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId: orderIdParam } = useParams();

    const orderData = location.state?.orderData || null;
    const token = location.state?.token || null;

    const [invoice, setInvoice] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [showPdfLoadingModal, setShowPdfLoadingModal] = useState(false);
    const [pdfLoadingAction, setPdfLoadingAction] = useState(null);
    const [error, setError] = useState(null);
    const invoicePrintCssRef = useRef(null);
    const invoicePdfCacheRef = useRef({ blob: null, filename: null, ready: false });
    const invoicePdfPrepareRef = useRef(null);

    const orderId = orderData?.id || orderIdParam;
    const isLoggedInOrder = orderData?._isLoggedIn ?? !!orderData?.customer?.id;

    // ── Load invoice + settings ──────────────────────────────────────────────
    useEffect(() => {
        if (!orderId) { setError('Order ID not found.'); setLoading(false); return; }

        const load = async () => {
            try {
                const headers = { Accept: 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;

                const [invRes, setRes] = await Promise.all([
                    fetch(`${INVOICE_API}?id=${orderId}`, { headers }),
                    fetch(SETTINGS_API, { headers: { Accept: 'application/json' } }),
                ]);

                const invData = await invRes.json();
                const setData = await setRes.json();

                if ((invData.status || invData.success) && invData.data) {
                    setInvoice(invData.data);
                } else {
                    setInvoice(orderData);
                }

                if (setData.success && setData.data?.data) {
                    setSettings({ ...setData.data.data, contact: setData.data.contact });
                }
            } catch {
                setInvoice(orderData);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId, token, orderData]);

    // ── Auto-navigate timer ──────────────────────────────────────────────────
    useEffect(() => {
        if (!invoice) return;
        const timer = setTimeout(() => navigate('/'), 30000);
        return () => clearTimeout(timer);
    }, [invoice, navigate]);

    // ── Scroll reset ──────────────────────────────────────────────────────────
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [loading]);

    // ── Pre-cache print CSS ──────────────────────────────────────────────────
    useEffect(() => {
        if (loading || !invoice) return undefined;
        let cancelled = false;
        const run = () => {
            collectDocumentStylesForPrint().then((css) => {
                if (!cancelled) invoicePrintCssRef.current = css;
            });
        };
        const id = requestAnimationFrame(run);
        return () => {
            cancelled = true;
            cancelAnimationFrame(id);
        };
    }, [loading, invoice, settings]);

    // ── Preload PDF for mobile ──────────────────────────────────────────────
    useEffect(() => {
        if (loading || !invoice || !isMobileBrowser()) return undefined;

        let cancelled = false;
        invoicePdfPrepareRef.current = null;
        invoicePdfCacheRef.current = { blob: null, filename: null, ready: false };

        const invoiceNo = invoice.invoice_id ?? orderId;

        const warmup = async () => {
            await requestMobileStoragePermission();
            await getHtml2Pdf();
            if (cancelled) return;

            const el = document.getElementById('invoice-root');
            if (!el) return;

            try {
                await startInvoicePdfPrepare(el, invoiceNo, invoicePdfCacheRef, invoicePdfPrepareRef);
            } catch {
                invoicePdfPrepareRef.current = null;
            }
        };

        const id = requestAnimationFrame(() => {
            requestAnimationFrame(warmup);
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(id);
            invoicePdfPrepareRef.current = null;
        };
    }, [loading, invoice, settings, orderId]);

    // ── Derived values ────────────────────────────────────────────────────────
    const logoPath = settings?.dark_logo || settings?.white_logo || null;
    const logoUrl = logoPath ? `${BASE_IMAGE_URL}${logoPath.replace(/^\/+/, '')}` : fallbackLogo;

    // ── Early returns ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="checkout-page invoice-page">
                <Container className="py-5 text-center">
                    <Spinner animation="border" style={{ color: '#c8102e' }} />
                    <p className="mt-3 text-muted">Generating your invoice...</p>
                </Container>
            </main>
        );
    }

    if (error && !invoice) {
        return (
            <main className="checkout-page invoice-page">
                <Container className="py-5 text-center">
                    <p className="text-danger">{error}</p>
                    <Link to="/" className="checkout-page__back-btn mt-3 d-inline-block">← Continue Shopping</Link>
                </Container>
            </main>
        );
    }

    const { orderdetails = [] } = invoice || {};

    const orderDate = invoice?.created_at
        ? new Date(invoice.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' });

    const subtotalAmt = Number(invoice?.amount ?? orderData?._subtotal ?? 0);
    const discountAmt = Number(invoice?.coupon_discount ?? orderData?._couponDiscount ?? 0);
    const shippingAmt = Number(invoice?.shipping_charge ?? orderData?._shippingAmount ?? 0);
    const grandAmt = Number(invoice?.final_amount ?? (subtotalAmt - discountAmt + shippingAmt));
    const paidAmt = Number(invoice?.paid_amount ?? 0);
    const dueAmt = Number(invoice?.due_amount ?? (grandAmt - paidAmt));

    const paymentMethod = invoice?.payment?.payment_method
        ?? invoice?.payment_method
        ?? orderData?._paymentMethod
        ?? 'Cash On Delivery';

    const customerName = orderData?._customerName
        || invoice?.shipping?.name
        || invoice?.customer?.name
        || invoice?.name
        || 'Customer';

    const customerPhone = orderData?._customerPhone
        || invoice?.shipping?.phone
        || invoice?.customer?.phone
        || invoice?.phone
        || '—';

    const customerAddressDisplay = orderData?._customerAddress
        ? orderData._customerAddress
        : (() => {
            const raw = invoice?.customer?.address || null;
            const district = invoice?.customer?.district || null;
            const division = invoice?.customer?.division?.name || null;
            return raw ? [raw, district, division].filter(Boolean).join(', ') : null;
        })();

    const shipAddrRaw = orderData?._deliveryAddress || invoice?.shipping?.address || invoice?.address || '—';
    const shipDistrict = orderData?._selectedDistrict || invoice?.shipping?.district || null;
    const shipDivision = orderData?._selectedDivision || invoice?.shipping?.division || null;
    const shippingAddressDisplay = [shipAddrRaw, shipDistrict, shipDivision].filter(Boolean).join(', ') || '—';

    const couponCode = orderData?._couponCode || invoice?.coupon_code || null;

    const siteName = settings?.name || 'ELONIS';
    const siteAddress = settings?.contact?.address || 'Dhaka, Bangladesh';
    const sitePhone = settings?.contact?.hotline || settings?.contact?.phone || '+88 01886 899103';
    const siteEmail = settings?.contact?.hotmail || settings?.contact?.email || 'info@elonis.com.bd';

    const invoiceNo = invoice?.invoice_id ?? orderId;

    const showCustomerAddress = isLoggedInOrder && !!customerAddressDisplay;
    const addressesAreSame = showCustomerAddress &&
        customerAddressDisplay.trim().toLowerCase() === shippingAddressDisplay.trim().toLowerCase();

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        const el = document.getElementById('invoice-root');
        if (!el || pdfLoading) return;

        try {
            if (isMobileBrowser()) {
                setShowPdfLoadingModal(true);
                setPdfLoadingAction('download');
            }

            setPdfLoading(true);

            if (isMobileBrowser()) {
                if (invoicePdfCacheRef.current?.ready && invoicePdfCacheRef.current.blob) {
                    await savePdfBlob(
                        invoicePdfCacheRef.current.blob,
                        invoicePdfCacheRef.current.filename || invoicePdfFilename(invoiceNo),
                    );
                    return;
                }

                await downloadInvoicePdfFile(el, invoiceNo, invoicePdfCacheRef, invoicePdfPrepareRef);
                return;
            }

            const printTarget = createSyncPrintTarget();

            const inlinedCss =
                invoicePrintCssRef.current || (await collectDocumentStylesForPrint());
            if (!invoicePrintCssRef.current) invoicePrintCssRef.current = inlinedCss;
            const html = buildInvoicePrintHtml(el.outerHTML, inlinedCss, invoiceNo);

            if (printTarget?.win) {
                writeHtmlToPrintTarget(printTarget, html);
                return;
            }

            const blobHtml = `${html}
<script>
(function() {
  function triggerPrint() { setTimeout(function() { window.print(); }, 900); }
  function whenImagesReady(cb) {
    var imgs = Array.prototype.slice.call(document.images);
    if (!imgs.length) { cb(); return; }
    var done = 0;
    function tick() { done++; if (done >= imgs.length) cb(); }
    imgs.forEach(function(img) {
      if (img.complete) tick();
      else { img.onload = tick; img.onerror = tick; }
    });
  }
  window.addEventListener('load', function() { whenImagesReady(triggerPrint); });
})();
<\/script>`;

            const blob = new Blob([blobHtml], { type: 'text/html;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const blobWin = window.open(blobUrl, '_blank');

            if (!blobWin || blobWin.closed || typeof blobWin.closed === 'undefined') {
                openBlobInvoiceOnMobile(blobUrl);
            } else {
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            }
        } finally {
            setPdfLoading(false);
            setTimeout(() => {
                setShowPdfLoadingModal(false);
                setPdfLoadingAction(null);
            }, 500);
        }
    };

    const handleSharePDF = async () => {
        const el = document.getElementById('invoice-root');
        if (!el || pdfLoading) return;

        try {
            setShowPdfLoadingModal(true);
            setPdfLoadingAction('share');
            setPdfLoading(true);

            let pdfBlob = null;

            if (invoicePdfCacheRef.current?.ready && invoicePdfCacheRef.current.blob) {
                pdfBlob = invoicePdfCacheRef.current.blob;
            } else {
                const prepared = await (invoicePdfPrepareRef.current || startInvoicePdfPrepare(el, invoiceNo, invoicePdfCacheRef, invoicePdfPrepareRef));
                pdfBlob = prepared?.blob;
            }

            if (!pdfBlob) {
                console.error('Failed to generate PDF for sharing');
                return;
            }

            const filename = invoicePdfFilename(invoiceNo);
            const file = new File([pdfBlob], filename, { type: 'application/pdf' });

            if (typeof navigator.share !== 'function' || !navigator.canShare?.({ files: [file] })) {
                await savePdfBlob(pdfBlob, filename);
                return;
            }

            await navigator.share({
                files: [file],
                title: `Invoice ${invoiceNo}`,
                text: `Check out my invoice from Elonis Lifestyle`,
            });
        } catch (err) {
            if (err?.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        } finally {
            setPdfLoading(false);
            setTimeout(() => {
                setShowPdfLoadingModal(false);
                setPdfLoadingAction(null);
            }, 500);
        }
    };

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <main className="checkout-page invoice-page">

            {/* Action Bar */}
            <div className="invoice-action-bar no-print">
                <Container fluid="xl">
                    <div className="invoice-action-bar__inner">
                        <div className="invoice-action-bar__left">
                            <span className="invoice-action-bar__badge">✅ Order Placed Successfully!</span>
                            <span className="invoice-action-bar__subtext">
                                Invoice #{invoiceNo} · {orderDate}
                            </span>
                        </div>
                        <div className="invoice-action-bar__btns">
                            <button className="inv-btn inv-btn--print" onClick={handlePrint}>🖨️ Print Invoice</button>
                            <button className="inv-btn inv-btn--pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
                                {pdfLoading && pdfLoadingAction === 'download' ? 'Generating PDF…' : '📄 Download PDF'}
                            </button>
                            {isMobileBrowser() && (
                                <button className="inv-btn inv-btn--share" onClick={handleSharePDF} disabled={pdfLoading}>
                                    {pdfLoading && pdfLoadingAction === 'share' ? 'Sharing…' : '📤 Share Invoice'}
                                </button>
                            )}
                            <Link to="/" className="inv-btn inv-btn--continue">🛒 Continue Shopping</Link>
                        </div>
                    </div>
                </Container>
            </div>

            {/* PDF Loading Modal */}
            <Modal
                show={showPdfLoadingModal}
                onHide={() => setShowPdfLoadingModal(false)}
                centered
                backdrop="static"
                keyboard={false}
                className="pdf-loading-modal"
            >
                <Modal.Body className="pdf-loading-modal__body">
                    <div className="pdf-loading-modal__content">
                        <div className="pdf-loading-modal__spinner">
                            <Spinner animation="border" role="status" style={{ color: '#FF6600' }}>
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                        <h5 className="pdf-loading-modal__title">
                            {pdfLoadingAction === 'share' ? 'Preparing Invoice for Sharing…' : 'Generating Your Invoice PDF…'}
                        </h5>
                        <p className="pdf-loading-modal__message">
                            {pdfLoadingAction === 'share'
                                ? 'Please wait while we prepare your invoice for sharing. Do not close this window.'
                                : 'Please wait while we prepare your invoice with all images and styles. Do not close this window.'}
                        </p>
                        <button
                            className="pdf-loading-modal__close-btn"
                            onClick={() => setShowPdfLoadingModal(false)}
                            style={{ marginTop: '16px' }}
                        >
                            Done
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Invoice Document */}
            <Container className="py-4 invoice-print-container" id="invoice-root">
                <div className="invoice-doc">

                    {/* Header */}
                    <div className="invoice-doc__header">
                        <div className="invoice-doc__brand">
                            <img
                                src={logoUrl}
                                alt={siteName}
                                className="invoice-doc__logo"
                                onError={(e) => { e.target.onerror = null; e.target.src = fallbackLogo; }}
                            />
                            <div className="invoice-doc__brand-info">
                                <p>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginRight: '6px' }}>
                                        <path d="M6.62 10.79a15.054 15.054 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.07 22 2 13.93 2 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" />
                                    </svg>
                                    {sitePhone}
                                </p>
                                <p>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginRight: '6px' }}>
                                        <path d="M20 4H4a2 2 0 00-2 2v.01l10 6.99 10-6.99V6a2 2 0 00-2-2zm0 4.24l-8 5.6-8-5.6V18a2 2 0 002 2h12a2 2 0 002-2V8.24z" />
                                    </svg>
                                    {siteEmail}
                                </p>
                                <p>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginRight: '6px' }}>
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z" />
                                    </svg>
                                    {siteAddress}
                                </p>
                            </div>
                        </div>
                        <div className="invoice-doc__meta">
                            <h1 className="invoice-doc__title">INVOICE</h1>
                            <table className="invoice-doc__meta-table">
                                <tbody>
                                    <tr><td>Invoice No:</td><td><strong>#{invoiceNo}</strong></td></tr>
                                    <tr><td>Date:</td>      <td><strong>{orderDate}</strong></td></tr>
                                    <tr><td>Payment:</td>   <td><strong>{paymentMethod}</strong></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <hr className="invoice-doc__divider" />

                    {/* Parties */}
                    <div className="invoice-doc__parties">
                        {!showCustomerAddress ? (
                            <div className="invoice-doc__bill-to">
                                <h6 className="invoice-doc__section-label">Delivery Info</h6>
                                <p className="invoice-doc__customer-name">{customerName}</p>
                                <p>{customerPhone}</p>
                                <p>{shippingAddressDisplay}</p>
                                {couponCode && (
                                    <p className="invoice-doc__coupon-tag">🏷️ Coupon: <strong>{couponCode}</strong></p>
                                )}
                            </div>
                        ) : addressesAreSame ? (
                            <div className="invoice-doc__bill-to">
                                <h6 className="invoice-doc__section-label">Customer Info</h6>
                                <p className="invoice-doc__customer-name">{customerName}</p>
                                <p>{customerPhone}</p>
                                <p>{customerAddressDisplay}</p>
                                {couponCode && (
                                    <p className="invoice-doc__coupon-tag">🏷️ Coupon: <strong>{couponCode}</strong></p>
                                )}
                            </div>
                        ) : (
                            <div className="invoice-doc__parties-cols" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div className="invoice-doc__bill-to">
                                    <h6 className="invoice-doc__section-label">Customer Info</h6>
                                    <p className="invoice-doc__customer-name">{customerName}</p>
                                    <p>{customerPhone}</p>
                                    <p>{customerAddressDisplay}</p>
                                    {couponCode && (
                                        <p className="invoice-doc__coupon-tag">🏷️ Coupon: <strong>{couponCode}</strong></p>
                                    )}
                                </div>
                                <div className="invoice-doc__ship-to">
                                    <h6 className="invoice-doc__section-label">Shipping Address</h6>
                                    <p className="invoice-doc__customer-name">{customerName}</p>
                                    <p>{customerPhone}</p>
                                    <p>{shippingAddressDisplay}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="invoice-doc__divider" />

                    {/* Items Table */}
                    <div className="invoice-doc__items-wrap">
                        <table className="invoice-doc__items-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th className="text-center">Size</th>
                                    <th className="text-center">Color</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-end">Unit Price</th>
                                    <th className="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderdetails.map((d, idx) => {
                                    const unitPrice = Number(d.sale_price ?? d.new_price ?? 0);
                                    const qty = Number(d.qty ?? 1);
                                    const raw = d.product_name || d.name || d.product?.name || '';
                                    const isSlug = /^[a-z0-9]+(-[a-z0-9]+)*-\d+$/.test(raw);
                                    const productName = isSlug
                                        ? (d.product?.name || raw)
                                        : (raw || `Product #${d.product_id}`);
                                    return (
                                        <tr key={d.id ?? idx}>
                                            <td>{idx + 1}</td>
                                            <td className="invoice-doc__product-name">{productName}</td>
                                            <td className="text-center">{d.product_size || d.size || '—'}</td>
                                            <td className="text-center">{d.product_color || d.color || '—'}</td>
                                            <td className="text-center">{qty}</td>
                                            <td className="text-end">{formatPrice(unitPrice)}</td>
                                            <td className="text-end"><strong>{formatPrice(unitPrice * qty)}</strong></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="invoice-doc__totals">
                        <div className="invoice-doc__totals-rows">
                            <div className="invoice-doc__total-row">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotalAmt)}</span>
                            </div>
                            {discountAmt > 0 && (
                                <div className="invoice-doc__total-row invoice-doc__total-row--discount">
                                    <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                                    <span>-{formatPrice(discountAmt)}</span>
                                </div>
                            )}
                            <div className="invoice-doc__total-row">
                                <span>Delivery Charge</span>
                                <span>{formatPrice(shippingAmt)}</span>
                            </div>
                            <div className="invoice-doc__total-row invoice-doc__total-row--grand">
                                <span>Total</span>
                                <span>{formatPrice(grandAmt)}</span>
                            </div>
                            <div className="invoice-doc__total-row invoice-doc__total-row--paid">
                                <span>Paid Amount</span>
                                <span>{formatPrice(paidAmt)}</span>
                            </div>
                            <div className="invoice-doc__total-row invoice-doc__total-row--due">
                                <span>Due Amount</span>
                                <span>{formatPrice(dueAmt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="invoice-doc__footer">
                        <div className="invoice-doc__footer-thanks">
                            <p>Thank you for shopping with <strong>{siteName}</strong>!</p>
                        </div>
                    </div>

                </div>
            </Container>
        </main>
    );
};

export default InvoicePage;