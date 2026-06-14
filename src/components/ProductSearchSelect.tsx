import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../data/mockData';

type ProductSearchSelectProps = {
  label: string;
  products: Product[];
  value: string;
  disabled?: boolean;
  noProductsText: string;
  placeholder?: string;
  onChange: (codigo: string) => void;
};

function getProductDisplayName(product: Product) {
  return product.displayName?.trim() || product.descrip?.trim() || 'Producto sin nombre';
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getProductSearchText(product: Product) {
  return normalizeSearchText(
    [
      product.codigo,
      product.descrip,
      product.displayName,
      product.searchName,
      product.familia,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function ProductSearchSelect({
  label,
  products,
  value,
  disabled = false,
  noProductsText,
  placeholder = 'Buscar producto por nombre o código...',
  onChange,
}: ProductSearchSelectProps) {
  const selectedProduct = useMemo(
    () => products.find((product) => product.codigo === value) ?? null,
    [products, value],
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(getProductDisplayName(selectedProduct));
      return;
    }

    setSearchTerm('');
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const normalizedTerm = normalizeSearchText(searchTerm);

    if (!normalizedTerm) {
      return products.slice(0, 12);
    }

    return products
      .filter((product) => getProductSearchText(product).includes(normalizedTerm))
      .slice(0, 12);
  }, [products, searchTerm]);

  function handleInputChange(inputValue: string) {
    setSearchTerm(inputValue);
    setIsOpen(true);

    if (selectedProduct && inputValue !== getProductDisplayName(selectedProduct)) {
      onChange('');
    }
  }

  function handleSelectProduct(product: Product) {
    onChange(product.codigo);
    setSearchTerm(getProductDisplayName(product));
    setIsOpen(false);
  }

  return (
    <div className="product-search-field">
      <label>{label}</label>

      <div
        className="product-search-combobox"
        onBlur={(event) => {
          const nextTarget = event.relatedTarget;

          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
            setIsOpen(false);

            if (selectedProduct) {
              setSearchTerm(getProductDisplayName(selectedProduct));
            }
          }
        }}
      >
        <input
          type="text"
          value={searchTerm}
          disabled={disabled}
          placeholder={products.length > 0 ? placeholder : noProductsText}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => handleInputChange(event.target.value)}
          autoComplete="off"
          required
        />

        {isOpen && !disabled ? (
          <div className="product-search-results">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.codigo}
                  type="button"
                  className="product-search-option"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelectProduct(product);
                  }}
                >
                  <strong>{getProductDisplayName(product)}</strong>
                  <span>
                    Código {product.codigo} · Stock {product.stock.toLocaleString('es-CL')}
                  </span>
                </button>
              ))
            ) : (
              <div className="product-search-empty">
                No se encontraron productos con esa búsqueda.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProductSearchSelect;