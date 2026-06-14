import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../language/useLanguage';
import { useInventory } from '../state/useInventory';
import { getSession } from '../api/authApi';

const sectionData = [
  {
    id: 'operation',
    titleKey: 'nav.group.operation',
    descriptionKey: 'landing.operationDescription',
    color: 'blue',
    items: [
      { to: '/home', labelKey: 'nav.dashboard', descKey: 'landing.dashboardDesc', icon: 'DA' },
      { to: '/sales', labelKey: 'nav.sales', descKey: 'landing.salesDesc', icon: 'VE' },
      { to: '/purchases', labelKey: 'nav.purchases', descKey: 'landing.purchasesDesc', icon: 'CO' },
      { to: '/inventory', labelKey: 'nav.inventory', descKey: 'landing.inventoryDesc', icon: 'IN' },
    ],
  },
  {
    id: 'management',
    titleKey: 'nav.group.management',
    descriptionKey: 'landing.managementDescription',
    color: 'amber',
    items: [
      { to: '/products', labelKey: 'nav.products', descKey: 'landing.productsDesc', icon: 'PR' },
      { to: '/customers', labelKey: 'nav.customers', descKey: 'landing.customersDesc', icon: 'CL' },
      { to: '/suppliers', labelKey: 'nav.suppliers', descKey: 'landing.suppliersDesc', icon: 'PV' },
    ],
  },
  {
    id: 'control',
    titleKey: 'nav.group.control',
    descriptionKey: 'landing.controlDescription',
    color: 'red',
    items: [
      { to: '/movements', labelKey: 'nav.movements', descKey: 'landing.movementsDesc', icon: 'MV' },
      { to: '/alerts', labelKey: 'nav.alerts', descKey: 'landing.alertsDesc', icon: 'AL' },
      { to: '/reports', labelKey: 'nav.reports', descKey: 'landing.reportsDesc', icon: 'RE' },
    ],
  },
];

function getSubmoduleIcon(to: string) {
  switch (to) {
    case '/home':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      );
    case '/sales':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      );
    case '/purchases':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      );
    case '/inventory':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      );
    case '/products':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      );
    case '/customers':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case '/suppliers':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      );
    case '/movements':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <polyline points="7 23 3 19 7 15"></polyline>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
      );
    case '/alerts':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      );
    case '/reports':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      );
    default:
      return null;
  }
}

function Landing() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { products, suppliers, movements } = useInventory();
  const session = getSession();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Flatten all items with their parent section metadata for search
  const allItems = useMemo(
    () =>
      sectionData.flatMap((section) =>
        section.items.map((item) => ({ ...item, section })),
      ),
    [],
  );

  // Computed: whether we are in search/filter mode
  const isFiltering = searchTerm.trim().length > 0 || selectedSection !== 'all';

  // Filter results for search mode
  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allItems.filter((item) => {
      const label = t(item.labelKey).toLowerCase();
      const desc = t(item.descKey).toLowerCase();
      const matchesSearch = !query || label.includes(query) || desc.includes(query);
      const matchesSection =
        selectedSection === 'all' || item.section.id === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [searchTerm, selectedSection, allItems, t]);

  // Filter product results for search mode
  const productResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query.length < 2) return [];

    return products
      .filter((product) => {
        const matchesSearch =
          product.descrip.toLowerCase().includes(query) ||
          product.codigo.toLowerCase().includes(query) ||
          product.familia.toLowerCase().includes(query) ||
          (product.ubicacion && product.ubicacion.toLowerCase().includes(query)) ||
          (product.proveedor && product.proveedor.toLowerCase().includes(query));

        // If 'control' is selected, don't show products since they reside in 'operation' and 'management'
        if (selectedSection === 'control') {
          return false;
        }

        // If selectedSection is operation/management, filter by it
        if (selectedSection === 'operation') {
          // Inventario is under operation
          return matchesSearch;
        }
        if (selectedSection === 'management') {
          // Productos is under management
          return matchesSearch;
        }

        return matchesSearch;
      })
      .slice(0, 8); // Top 8 matches
  }, [searchTerm, selectedSection, products]);

  const hasAnyResults = searchResults.length > 0 || productResults.length > 0;
  const shouldAllowLandingScroll = isFiltering || expandedCard !== null;

  // Real-time calculations for metrics
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const activeAlertsCount = useMemo(() => {
    return products.filter((product) => {
      const currentStock = Number(product.stock) || 0;
      const minimumStock = Number(product.minStock) || 0;

      if (currentStock > minimumStock) {
        return false;
      }

      return (
        product.dataIssue === 'STOCK_NEGATIVO' ||
        currentStock <= 0 ||
        currentStock <= minimumStock
      );
    }).length;
  }, [products]);

  const shipmentsCount = useMemo(() => {
    return movements.filter((m) => m.type === 'Salida').length;
  }, [movements]);

  const toggleCard = (sectionId: string) => {
    setExpandedCard((prev) => (prev === sectionId ? null : sectionId));
  };

  return (
    <AppLayout
      title={t('landing.title')}
      description={t('landing.subtitle')}
    >
      <div className={`landing-fit-screen ${shouldAllowLandingScroll ? 'can-scroll' : ''}`}>
        {/* ── Global Search & Filter Bar ───────────────────────── */}
      <div className="landing-search-bar">
        <div className="landing-search-input-wrapper">
          <svg
            className="landing-search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="landing-search"
            type="search"
            className="landing-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('landing.searchPlaceholder') || 'Buscar modulo, funcion o producto...'}
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              className="landing-search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar busqueda"
            >
              ×
            </button>
          )}
        </div>

        {/* Section pills */}
        <div className="landing-section-pills">
          {[
            { id: 'all', labelKey: 'reports.all' },
            { id: 'operation', labelKey: 'nav.group.operation' },
            { id: 'management', labelKey: 'nav.group.management' },
            { id: 'control', labelKey: 'nav.group.control' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`landing-pill ${selectedSection === pill.id ? 'active' : ''}`}
              onClick={() => setSelectedSection(pill.id)}
            >
              {t(pill.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      {isFiltering ? (
        <div className="landing-sections">
          {hasAnyResults ? (
            <div className="landing-search-results-container">
              {/* Modules Group */}
              {searchResults.length > 0 && (
                <div className="landing-results-group">
                  <h3 className="landing-results-section-title">
                    {t('landing.searchModulesTitle') || 'Módulos y Funciones'}
                  </h3>
                  <div className="landing-search-results-grid">
                    {searchResults.map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        className={`landing-card landing-card--${item.section.color} landing-card--search-result`}
                        onClick={() => navigate(item.to)}
                      >
                        <div className={`landing-card-icon ${item.section.color}`}>
                          {item.icon}
                        </div>
                        <div className="landing-card-content">
                          <strong>{t(item.labelKey)}</strong>
                          <p>{t(item.descKey)}</p>
                          <span className={`landing-card-section-badge landing-badge--${item.section.color}`}>
                            {t(item.section.titleKey)}
                          </span>
                        </div>
                        <span className="landing-card-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Group */}
              {productResults.length > 0 && (
                <div className="landing-results-group">
                  <h3 className="landing-results-section-title">
                    {t('landing.searchProductsTitle') || 'Productos e Inventario'}
                  </h3>
                  <div className="landing-products-grid">
                    {productResults.map((product) => (
                      <div key={product.codigo} className="landing-product-card">
                        <div className="landing-product-card-head">
                          <span className="landing-product-family-badge">
                            {product.familia}
                          </span>
                          <span className="landing-product-code">
                            #{product.codigo}
                          </span>
                        </div>
                        <strong className="landing-product-name">{product.descrip}</strong>

                        <div className="landing-product-meta">
                          {product.ubicacion && (
                            <span className="landing-product-meta-item">
                              📍 {product.ubicacion}
                            </span>
                          )}
                          <span className="landing-product-meta-item">
                            📦 Stock: <strong>{product.stock.toLocaleString('es-CL')}</strong> uds
                          </span>
                        </div>

                        <div className="landing-product-location-info">
                          <span className="landing-product-location-label">
                            {t('landing.locatedIn') || 'Se ubica en:'}
                          </span>
                          <div className="landing-product-actions">
                            <button
                              type="button"
                              className="landing-product-action-btn landing-product-action-btn--inventory"
                              onClick={() => navigate(`/inventory?search=${product.codigo}`)}
                              title={t('landing.viewInInventoryHint') || 'Ver stock, costo y movimientos en el módulo de Inventario'}
                            >
                              <span className="landing-btn-icon">📍</span>
                              <div className="landing-btn-text">
                                <strong>{t('nav.inventory') || 'Inventario'}</strong>
                                <span>{t('nav.group.operation') || 'Operación'}</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              className="landing-product-action-btn landing-product-action-btn--products"
                              onClick={() => navigate(`/products?search=${product.codigo}`)}
                              title={t('landing.viewInProductsHint') || 'Ver catálogo, precios y detalles en el módulo de Productos'}
                            >
                              <span className="landing-btn-icon">📦</span>
                              <div className="landing-btn-text">
                                <strong>{t('nav.products') || 'Productos'}</strong>
                                <span>{t('nav.group.management') || 'Gestión'}</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="landing-empty-search">
              <span className="landing-empty-icon">🔍</span>
              <strong>{t('landing.noResults') || 'Sin resultados'}</strong>
              <p>{t('landing.noResultsHint') || 'Intenta con otro termino o cambia el filtro de seccion.'}</p>
            </div>
          )}
        </div>
      ) : (
        /* Premium Dashboard Layout matching target image */
        <div className="landing-dashboard-overview">
          {/* Welcome and Summary header */}
          <div className="landing-welcome-container">
            <div className="landing-welcome-info">
              <h1>
                {language === 'es'
                  ? `Welcome back, ${session?.user.name ?? 'Alex'}.`
                  : `Welcome back, ${session?.user.name ?? 'Alex'}.`}
              </h1>
              <p>
                {language === 'es' ? (
                  <>
                    Operational status is <span className="status-highlight">Stable</span>. You have <strong style={{ color: '#dc2626' }}>{activeAlertsCount}</strong> pending alerts to review.
                  </>
                ) : (
                  <>
                    Operational status is <span className="status-highlight">Stable</span>. You have <strong style={{ color: '#dc2626' }}>{activeAlertsCount}</strong> pending alerts to review.
                  </>
                )}
              </p>
            </div>

            <div className="landing-top-summaries">
              <div className="landing-summary-widget">
                <span>{language === 'es' ? 'TOTAL ITEMS' : 'TOTAL ITEMS'}</span>
                <strong>{totalStockUnits.toLocaleString()}</strong>
              </div>
              <div className="landing-summary-widget alert-widget">
                <span>{language === 'es' ? 'ACTIVE ALERTS' : 'ACTIVE ALERTS'}</span>
                <strong>{activeAlertsCount < 10 ? `0${activeAlertsCount}` : activeAlertsCount}</strong>
              </div>
              <div className="landing-summary-widget shipment-widget">
                <span>{language === 'es' ? 'SHIPMENTS' : 'SHIPMENTS'}</span>
                <strong>{shipmentsCount}</strong>
              </div>
            </div>
          </div>

          {/* Grid of the 3 major components */}
          <div className="landing-main-dashboard-grid">
            {/* Card 1: Operación */}
            <div className={`landing-column-card card-blue ${expandedCard === 'operation' ? 'is-expanded' : ''}`} onClick={() => toggleCard('operation')} style={{ cursor: 'pointer' }}>
              <div className="landing-column-header">
                <div className="landing-column-icon-box blue">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                  </svg>
                </div>
                <div className={`landing-column-arrow-box ${expandedCard === 'operation' ? 'rotated' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
              <div className="landing-column-info">
                <h2>{language === 'es' ? 'Operación' : 'Operación'}</h2>
                <p>
                  {language === 'es'
                    ? 'Real-time oversight of manufacturing cycles, stock levels, and purchasing workflows.'
                    : 'Real-time oversight of manufacturing cycles, stock levels, and purchasing workflows.'}
                </p>
              </div>

              <div className={`landing-sub-options-grid ${expandedCard === 'operation' ? 'is-visible' : ''}`} onClick={(e) => e.stopPropagation()}>
                {sectionData[0].items.map((item) => (
                  <Link key={item.to} to={item.to} className="landing-sub-option-item">
                    <span className="landing-sub-option-icon blue">{getSubmoduleIcon(item.to)}</span>
                    <span>{t(item.labelKey)}</span>
                    <span className="arrow-indicator">→</span>
                  </Link>
                ))}
              </div>

              <div className="landing-column-stats">
                <div className="landing-stat-box stat-blue">
                  <span>EFFICIENCY</span>
                  <strong>94.2%</strong>
                </div>
                <div className="landing-stat-box stat-blue">
                  <span>ACTIVE JOBS</span>
                  <strong>{movements.length}</strong>
                </div>
              </div>
            </div>

            {/* Card 2: Gestión */}
            <div className={`landing-column-card card-amber ${expandedCard === 'management' ? 'is-expanded' : ''}`} onClick={() => toggleCard('management')} style={{ cursor: 'pointer' }}>
              <div className="landing-column-header">
                <div className="landing-column-icon-box amber">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className={`landing-column-arrow-box ${expandedCard === 'management' ? 'rotated' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
              <div className="landing-column-info">
                <h2>{language === 'es' ? 'Gestión' : 'Gestión'}</h2>
                <p>
                  {language === 'es'
                    ? 'Comprehensive management of client relations, supplier contracts, and product catalogs.'
                    : 'Comprehensive management of client relations, supplier contracts, and product catalogs.'}
                </p>
              </div>

              <div className={`landing-sub-options-grid ${expandedCard === 'management' ? 'is-visible' : ''}`} onClick={(e) => e.stopPropagation()}>
                {sectionData[1].items.map((item) => (
                  <Link key={item.to} to={item.to} className="landing-sub-option-item">
                    <span className="landing-sub-option-icon amber">{getSubmoduleIcon(item.to)}</span>
                    <span>{t(item.labelKey)}</span>
                    <span className="arrow-indicator">→</span>
                  </Link>
                ))}
              </div>

              <div className="landing-column-stats">
                <div className="landing-stat-box stat-amber">
                  <span>NEW LEADS</span>
                  <strong>24</strong>
                </div>
                <div className="landing-stat-box stat-amber">
                  <span>SUPPLIERS</span>
                  <strong>{suppliers.length}</strong>
                </div>
              </div>
            </div>

            {/* Card 3: Control */}
            <div className={`landing-column-card card-red ${expandedCard === 'control' ? 'is-expanded' : ''}`} onClick={() => toggleCard('control')} style={{ cursor: 'pointer' }}>
              <div className="landing-column-header">
                <div className="landing-column-icon-box red">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div className={`landing-column-arrow-box ${expandedCard === 'control' ? 'rotated' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
              <div className="landing-column-info">
                <h2>{language === 'es' ? 'Control' : 'Control'}</h2>
                <p>
                  {language === 'es'
                    ? 'Critical monitoring system for audit trails, security alerts, and compliance reporting.'
                    : 'Critical monitoring system for audit trails, security alerts, and compliance reporting.'}
                </p>
              </div>

              <div className={`landing-sub-options-grid ${expandedCard === 'control' ? 'is-visible' : ''}`} onClick={(e) => e.stopPropagation()}>
                {sectionData[2].items.map((item) => (
                  <Link key={item.to} to={item.to} className="landing-sub-option-item">
                    <span className="landing-sub-option-icon red">{getSubmoduleIcon(item.to)}</span>
                    <span>{t(item.labelKey)}</span>
                    <span className="arrow-indicator">→</span>
                  </Link>
                ))}
              </div>

              <div className="landing-column-stats">
                <div className="landing-stat-box stat-red">
                  <span>UPTIME</span>
                  <strong>99.9%</strong>
                </div>
                <div className="landing-stat-box stat-red">
                  <span>INCIDENTS</span>
                  <strong>{activeAlertsCount > 0 ? activeAlertsCount : 'None'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}

export default Landing;

