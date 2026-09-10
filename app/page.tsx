"use client";

import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/products";

export default function Home() {
  const { addToCart, itemCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("all");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.error("Error loading products:", error);
      setError("تعذر تحميل المنتجات حاليًا.");
      setProducts([]);
      setLoading(false);
      return;
    }

    const normalizedProducts: Product[] = (data ?? []).map((product) => ({
      id: String(product.id),
      name: product.name ?? "",
      category: product.category ?? "",
      categoryName: product.categoryName ?? product.category_name ?? "",
      price: Number(product.price ?? 0),
      oldPrice:
        product.oldPrice != null
          ? Number(product.oldPrice)
          : product.old_price != null
          ? Number(product.old_price)
          : undefined,
      image: product.image ?? "📦",
      description: product.description ?? "",
      features: Array.isArray(product.features) ? product.features : [],
      rating: Number(product.rating ?? 0),
      reviews: Number(product.reviews ?? 0),
      stock: Number(product.stock ?? 0),
      badge: product.badge ?? undefined,
    }));

    setProducts(normalizedProducts);
    setLoading(false);
  };

  const filteredProducts =
    category === "all"
      ? products
      : products.filter((product) => product.category === category);

  const goToProduct = (id: string) => {
    window.location.href = `/products/${id}`;
  };

  const addProduct = (id: string) => {
    const product = products.find((item) => item.id === id);

    if (!product || product.stock <= 0) return;

    addToCart(product, 1);

    setAddedId(id);

    setTimeout(() => {
      setAddedId(null);
    }, 1500);
  };

  const goToCart = () => {
    window.location.href = "/cart";
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f8fa] text-slate-900"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 lg:px-8">
          {/* LOGO */}
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-white">
                N
              </div>

              <div className="text-right leading-none">
                <div className="text-xl font-black tracking-tight">
                  N-DIGITAL
                </div>

                <div className="mt-1 text-[10px] font-medium tracking-[0.25em] text-slate-400">
                  DIGITAL STORE
                </div>
              </div>
            </div>
          </button>

          {/* NAVIGATION */}
          <div className="mr-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 sm:block"
            >
              الرئيسية
            </button>

            <button
              type="button"
              onClick={goToCart}
              aria-label="سلة المشتريات"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl text-white transition hover:bg-slate-800"
            >
              🛒

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-950 shadow">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                N-DIGITAL STORE
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                كل ما تحتاجه من
                <span className="block text-slate-500">
                  التقنية في مكان واحد
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-500">
                هواتف، حواسيب، شاشات وإكسسوارات
                تقنية مختارة بعناية وبأسعار منافسة.
              </p>

              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-8 inline-flex rounded-xl bg-slate-950 px-7 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                تسوق الآن
              </button>
            </div>

            <div className="flex min-h-80 items-center justify-center rounded-3xl bg-slate-100">
              <div className="text-[10rem] sm:text-[13rem]">
                📱
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
                category === "all"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الكل
            </button>

            <button
              type="button"
              onClick={() => setCategory("phones")}
              className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
                category === "phones"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الهواتف
            </button>

            <button
              type="button"
              onClick={() => setCategory("laptops")}
              className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
                category === "laptops"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الحواسيب
            </button>

            <button
              type="button"
              onClick={() => setCategory("screens")}
              className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
                category === "screens"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الشاشات
            </button>

            <button
              type="button"
              onClick={() => setCategory("accessories")}
              className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
                category === "accessories"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              الإكسسوارات
            </button>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-5 py-14 lg:px-8"
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400">
              منتجات مختارة
            </p>

            <h2 className="mt-2 text-3xl font-black">
              أحدث المنتجات
            </h2>
          </div>

          {!loading && (
            <span className="text-sm text-slate-400">
              {filteredProducts.length} منتجات
            </span>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
              <p className="text-sm font-bold text-slate-500">
                جاري تحميل المنتجات...
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProducts}
              className="mt-5 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <div className="text-6xl">📦</div>

            <h3 className="mt-5 text-xl font-black">
              لا توجد منتجات حاليًا
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              ستظهر المنتجات هنا بمجرد إضافتها من لوحة التحكم.
            </p>
          </div>
        )}

        {/* PRODUCTS GRID */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const discount = product.oldPrice
                ? Math.round(
                    ((product.oldPrice - product.price) /
                      product.oldPrice) *
                      100
                  )
                : 0;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* PRODUCT IMAGE */}
                  <button
                    type="button"
                    onClick={() => goToProduct(product.id)}
                    className="relative flex h-60 w-full cursor-pointer items-center justify-center bg-slate-50"
                  >
                    {product.badge && (
                      <span className="absolute right-4 top-4 rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white">
                        {product.badge}
                      </span>
                    )}

                    {discount > 0 && (
                      <span className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm">
                        -{discount}%
                      </span>
                    )}

                    {product.image?.startsWith("http") ||
                    product.image?.startsWith("/") ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain p-5 transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <span className="text-8xl transition duration-300 hover:scale-110">
                        {product.image || "📦"}
                      </span>
                    )}
                  </button>

                  {/* PRODUCT INFO */}
                  <div className="p-5">
                    <button
                      type="button"
                      onClick={() => goToProduct(product.id)}
                      className="block w-full text-right"
                    >
                      <p className="text-xs font-bold text-slate-400">
                        {product.categoryName}
                      </p>

                      <h3 className="mt-2 min-h-12 text-lg font-black">
                        {product.name}
                      </h3>
                    </button>

                    <div className="mt-3 flex items-center gap-2">
                      <span>★</span>

                      <span className="text-sm font-bold">
                        {product.rating}
                      </span>

                      <span className="text-xs text-slate-400">
                        ({product.reviews})
                      </span>
                    </div>

                    {/* PRICE */}
                    <div className="mt-5">
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black">
                          {product.price.toLocaleString("ar-DZ")}
                        </span>

                        <span className="mb-1 text-sm font-bold">
                          دج
                        </span>
                      </div>

                      {product.oldPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {product.oldPrice.toLocaleString("ar-DZ")} دج
                        </span>
                      )}
                    </div>

                    {/* STOCK */}
                    {product.stock > 0 && (
                      <p className="mt-3 text-xs font-semibold text-emerald-600">
                        متوفر في المخزون: {product.stock}
                      </p>
                    )}

                    {/* ADD TO CART */}
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => addProduct(product.id)}
                      className={`mt-5 flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-white transition ${
                        product.stock <= 0
                          ? "cursor-not-allowed bg-slate-300"
                          : addedId === product.id
                          ? "bg-emerald-600"
                          : "bg-slate-950 hover:bg-slate-800"
                      }`}
                    >
                      {product.stock <= 0
                        ? "غير متوفر"
                        : addedId === product.id
                        ? "✓ تمت الإضافة إلى السلة"
                        : "🛒 أضف إلى السلة"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* PROMOTION */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-slate-100 p-10 text-center md:flex-row md:text-right">
            <div>
              <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">
                عروض خاصة
              </span>

              <h2 className="mt-5 text-3xl font-black">
                خصومات تصل إلى 30%
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                استفد من عروضنا الخاصة على مجموعة مختارة من المنتجات.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-xl bg-slate-950 px-7 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              اكتشف العروض
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-center text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © 2026 N-DIGITAL. جميع الحقوق محفوظة.
          </p>

          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="text-slate-400 transition hover:text-white"
          >
            متجر إلكترونيات وتقنيات رقمية
          </button>
        </div>
      </footer>
    </main>
  );
}