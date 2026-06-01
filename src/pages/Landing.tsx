import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../language/useLanguage';
import { useInventory } from '../state/useInventory';

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

function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { products } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

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

  // Filtered sections for non-search grouped view
  const filteredSections = useMemo(
    () =>
      sectionData.filter(
        (s) => selectedSection === 'all' || s.id === selectedSection,
      ),
    [selectedSection],
  );

  const hasAnyResults = searchResults.length > 0 || productResults.length > 0;

  return (
    <AppLayout
      title={t('landing.title')}
      description={t('landing.subtitle')}
    >
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
        /* Default grouped view */
        <div className="landing-sections">
          {filteredSections.map((section, sectionIndex) => (
            <section
              key={section.id}
              className={`landing-section landing-section--${section.color}`}
              style={{ animationDelay: `${sectionIndex * 0.1}s` }}
            >
              <div className="landing-section-header">
                <div className={`landing-section-indicator ${section.color}`} />
                <div>
                  <h2>{t(section.titleKey)}</h2>
                  <p>{t(section.descriptionKey)}</p>
                </div>
              </div>

              <div className="landing-cards-grid">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={item.to}
                    type="button"
                    className={`landing-card landing-card--${section.color}`}
                    onClick={() => navigate(item.to)}
                    style={{ animationDelay: `${sectionIndex * 0.1 + itemIndex * 0.06}s` }}
                  >
                    <div className={`landing-card-icon ${section.color}`}>
                      {item.icon}
                    </div>
                    <div className="landing-card-content">
                      <strong>{t(item.labelKey)}</strong>
                      <p>{t(item.descKey)}</p>
                    </div>
                    <span className="landing-card-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default Landing;

