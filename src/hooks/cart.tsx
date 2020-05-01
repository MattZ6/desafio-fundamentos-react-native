import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface AddProduct {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity?: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: AddProduct): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const ITEMS_KEY = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem(ITEMS_KEY);

      if (items) {
        setProducts(JSON.parse(items));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (item: AddProduct) => {
      const exists = products.some(x => x.id === item.id);

      let updatedProducts: Product[] = [];

      if (exists) {
        updatedProducts = products.map(x =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x,
        );
      } else {
        updatedProducts = [...products, { ...item, quantity: 1 }];
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updatedProducts));
    },
    [products],
  );

  const increment = useCallback(
    async (id: string) => {
      const updatedProducts = products.map(x =>
        x.id === id ? { ...x, quantity: x.quantity + 1 } : x,
      );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updatedProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const mustRemove = products.some(x => x.id === id && x.quantity === 1);

      let updatedProducts: Product[];

      if (mustRemove) {
        updatedProducts = products.filter(x => x.id !== id);
      } else {
        updatedProducts = products.map(x =>
          x.id === id ? { ...x, quantity: x.quantity - 1 } : x,
        );
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updatedProducts));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
