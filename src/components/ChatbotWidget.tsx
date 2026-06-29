import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  sendChatbotMessage,
  type ChatbotProduct,
  type InventorySummary,
} from '../api/chatbotApi';
import { isAuthenticated } from '../api/authApi';
import { useLanguage } from '../language/useLanguage';

type ChatMessage = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  product?: ChatbotProduct | null;
  products?: ChatbotProduct[];
  summary?: InventorySummary;
};

const suggestions = [
  'Resumen de inventario',
  '¿Qué es el cloro?',
  'Productos bajo mínimo',
  'Productos sin stock',
  'Productos con menor stock',
  'Productos con mayor stock',
  'Productos que requieren ajuste',
];

const statusLabels: Record<ChatbotProduct['status'], string> = {
  DISPONIBLE: 'Disponible',
  BAJO_MINIMO: 'Bajo mínimo',
  SIN_STOCK: 'Sin stock',
  REQUIERE_AJUSTE: 'Requiere ajuste',
};

function ProductResult({
  product,
  compact = false,
}: {
  product: ChatbotProduct;
  compact?: boolean;
}) {
  return (
    <div className={`chatbot-product-result${compact ? ' compact' : ''}`}>
      <div className="chatbot-product-main">
        <span className={`chatbot-stock-indicator ${product.status.toLowerCase()}`} />
        <div>
          <strong title={product.descrip}>{product.descrip}</strong>
          <small>{product.codigo}</small>
        </div>
      </div>
      <div className="chatbot-product-stock">
        <strong>{product.stock}</strong>
        <span>stock</span>
        {!compact ? <small>Mínimo: {product.minStock}</small> : null}
      </div>
      {!compact ? (
        <span className={`chatbot-status ${product.status.toLowerCase()}`}>
          {statusLabels[product.status]}
        </span>
      ) : null}
    </div>
  );
}

function SummaryResult({ summary }: { summary: InventorySummary }) {
  const items = [
    ['Productos', summary.totalProducts],
    ['Unidades', summary.totalUnits],
    ['Disponibles', summary.availableProducts],
    ['Bajo mínimo', summary.lowStockProducts],
    ['Sin stock', summary.outOfStockProducts],
    ['Por ajustar', summary.adjustmentProducts],
  ] as const;

  return (
    <div className="chatbot-summary-result">
      {items.map(([label, value]) => (
        <div key={label}>
          <strong>{value.toLocaleString('es-CL')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function ProductListResult({ products }: { products: ChatbotProduct[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleProducts = isExpanded ? products : products.slice(0, 3);
  const hiddenCount = products.length - 3;

  return (
    <div className="chatbot-product-list">
      {visibleProducts.map((product) => (
        <ProductResult key={product.codigo} product={product} compact />
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="chatbot-list-toggle"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? 'Mostrar menos' : `Mostrar ${hiddenCount} más`}
        </button>
      ) : null}
    </div>
  );
}

function ChatbotWidget() {
  const { language } = useLanguage();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const canShowChatbot = isAuthenticated();
  const welcomeText = useMemo(
    () =>
      language === 'es'
        ? 'Hola. Puedo consultar stock, productos bajo mínimo, resumen de inventario y explicar conceptos básicos de productos.'
        : 'Hello. I can check stock, low stock products, inventory summaries and basic product concepts.',
    [language],
  );

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!messages.length) {
      setMessages([{ id: 'welcome', sender: 'bot', text: welcomeText }]);
    }
  }, [messages.length, welcomeText]);

  if (!canShowChatbot) {
    return null;
  }

  const submitMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();

    if (!message || isLoading) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), sender: 'user', text: message },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage(message);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: response.answer,
          product: response.product,
          products: response.products,
          summary: response.summary,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: 'bot',
          text:
            error instanceof Error
              ? error.message
              : 'No se pudo conectar con el chatbot.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage(input);
  };

  return (
    <div className="chatbot-widget">
      {isOpen ? (
        <section className="chatbot-panel" aria-label="Chatbot SICD">
          <header className="chatbot-header">
            <div>
              <span className="chatbot-status-dot" />
              <div>
                <strong>Asistente SICD</strong>
                <p>{language === 'es' ? 'Consulta de inventario' : 'Inventory queries'}</p>
              </div>
            </div>
            <button
              type="button"
              className="chatbot-close-button"
              onClick={() => setIsOpen(false)}
              aria-label={language === 'es' ? 'Cerrar chatbot' : 'Close chatbot'}
            >
              x
            </button>
          </header>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <article
                className={`chatbot-message ${message.sender}`}
                key={message.id}
              >
                <p>{message.text}</p>
                {message.product ? <ProductResult product={message.product} /> : null}
                {message.products?.length ? (
                  <ProductListResult products={message.products} />
                ) : null}
                {message.summary ? <SummaryResult summary={message.summary} /> : null}
              </article>
            ))}
            {isLoading ? (
              <div className="chatbot-loading">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          <div className="chatbot-suggestions">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => void submitMessage(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                language === 'es'
                  ? 'Consulta productos o inventario...'
                  : 'Ask about products or inventory...'
              }
              maxLength={200}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {language === 'es' ? 'Enviar' : 'Send'}
            </button>
          </form>

          <p className="chatbot-disclaimer">
            {language === 'es'
              ? 'Respuesta informativa. Verifica los datos antes de tomar decisiones.'
              : 'Informational response. Verify the data before making decisions.'}
          </p>
        </section>
      ) : null}

      <button
        type="button"
        className="chatbot-floating-button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={language === 'es' ? 'Abrir chatbot' : 'Open chatbot'}
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.65V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4z" />
          <path d="M8 9h.01M12 9h.01M16 9h.01" />
        </svg>
      </button>
    </div>
  );
}

export default ChatbotWidget;
