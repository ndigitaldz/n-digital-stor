"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "./products";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  total: number;
  hydrated: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const STORAGE_KEY = "n-digital-cart";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  }, [items, hydrated]);

  const addToCart = (
    product: Product,
    quantity = 1
  ) => {
    if (product.stock <= 0) return;

    const safeQuantity = Math.max(
      1,
      Math.min(quantity, product.stock)
    );

    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + safeQuantity,
                  product.stock
                ),
              }
            : item
        );
      }

      return [
        ...current,
        {
          product,
          quantity: safeQuantity,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((current) =>
      current.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number
  ) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter(
          (item) => item.product.id !== productId
        );
      }

      return current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(
                quantity,
                item.product.stock
              ),
            }
          : item
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.product.price * item.quantity,
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        hydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart يجب استخدامه داخل CartProvider"
    );
  }

  return context;
}