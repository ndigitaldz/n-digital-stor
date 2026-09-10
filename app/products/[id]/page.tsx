"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getProductById } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ProductWithImages = {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[] | null;
  description: string;
  features: string[];
  rating: number;
  reviews: number;
  stock: number;
  badge?: string;
};

export default function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = use(params);

  const { addToCart, itemCount } = useCart();

  const [product, setProduct] =
    useState<ProductWithImages | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] =
    useState("");

  const [quantity, setQuantity] = useState(1);

  const [added, setAdded] = useState(false);

  /*
   * تحميل المنتج من Supabase
   *
   * وإذا لم نجده هناك نستخدم المنتج القديم
   * الموجود في lib/products.ts.
   */
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        const loadedProduct =
          data as ProductWithImages;

        setProduct(loadedProduct);

        const images =
          Array.isArray(loadedProduct.images) &&
          loadedProduct.images.length > 0
            ? loadedProduct.images
            : loadedProduct.image
              ? [loadedProduct.image]
              : [];

        setSelectedImage(images[0] || "");
      } else {
        /*
         * توافق مع المنتجات القديمة
         */
        const oldProduct =
          getProductById(id) as ProductWithImages | undefined;

        if (oldProduct) {
          setProduct(oldProduct);

          const images =
            Array.isArray(oldProduct.images) &&
            oldProduct.images.length > 0
              ? oldProduct.images
              : oldProduct.image
                ? [oldProduct.image]
                : [];

          setSelectedImage(images[0] || "");
        } else {
          setProduct(null);
        }
      }

      setLoading(false);
    }

    loadProduct();
  }, [id]);

  /*
   * أثناء تحميل المنتج
   */
  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5"
      >
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-12 text-center shadow-sm">
          <div className="text-5xl">⏳</div>

          <h1 className="mt-5 text-xl font-black">
            جاري تحميل المنتج...
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            يرجى الانتظار قليلاً
          </p>
        </div>
      </main>
    );
  }

  /*
   * المنتج غير موجود
   */
  if (!product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <div className="text-6xl">🔍</div>

          <h1 className="mt-5 text-2xl font-black">
            المنتج غير موجود
          </h1>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
          >
            العودة إلى المتجر
          </Link>
        </div>
      </main>
    );
  }

  /*
   * تجهيز صور المنتج
   *
   * المنتجات الجديدة تستخدم images[]
   * والمنتجات القديمة تستخدم image
   */
  const productImages =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  /*
   * في حال عدم وجود صورة محددة
   * نستخدم أول صورة
   */
  const mainImage =
    selectedImage ||
    productImages[0] ||
    product.image ||
    "";

  const discount = product.oldPrice
    ? Math.round(
        ((product.oldPrice - product.price) /
          product.oldPrice) *
          100
      )
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    window.location.href = "/cart";
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f8fa] text-slate-900"
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 lg:px-8">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 font-black text-white">
                N
              </div>

              <div>
                <div className="text-xl font-black">
                  N-DIGITAL
                </div>

                <div className="text-[10px] tracking-[0.25em] text-slate-400">
                  DIGITAL STORE
                </div>
              </div>
            </div>
          </Link>

          <div className="mr-auto">
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl text-white"
            >
              🛒

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-950">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================= */}
      {/* BREADCRUMB */}
      {/* ================================================= */}

      <div className="mx-auto max-w-7xl px-5 pt-7 lg:px-8">
        <div className="text-sm text-slate-400">
          <Link href="/">
            الرئيسية
          </Link>

          <span className="mx-2">
            /
          </span>

          <span>
            {product.categoryName}
          </span>

          <span className="mx-2">
            /
          </span>

          <span className="text-slate-600">
            {product.name}
          </span>
        </div>
      </div>

      {/* ================================================= */}
      {/* PRODUCT */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* ================================================= */}
          {/* الصور */}
          {/* ================================================= */}

          <div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="relative flex min-h-[450px] items-center justify-center bg-slate-50 p-6">

                {/* الشارات */}

                <div className="absolute right-5 top-5 z-10 flex gap-2">
                  {product.badge && (
                    <span className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white">
                      {product.badge}
                    </span>
                  )}

                  {discount > 0 && (
                    <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm">
                      خصم {discount}%
                    </span>
                  )}
                </div>

                {/* الصورة الرئيسية */}

                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="max-h-[430px] w-full object-contain transition duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="text-[10rem]">
                    {product.image || "📦"}
                  </div>
                )}
              </div>
            </div>

            {/* ================================================= */}
            {/* الصور المصغرة */}
            {/* ================================================= */}

            {productImages.length > 1 && (
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {productImages.map(
                    (image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(image)
                        }
                        className={`relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border-2 bg-white transition ${
                          mainImage === image
                            ? "border-slate-950 shadow-md"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} - صورة ${index + 1}`}
                          className="h-full w-full object-contain p-2"
                        />

                        {mainImage === image && (
                          <span className="absolute bottom-1 right-1 rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-bold text-white">
                            الرئيسية
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>

                <p className="mt-3 text-center text-xs text-slate-400">
                  اضغط على أي صورة لعرضها
                </p>
              </div>
            )}
          </div>

          {/* ================================================= */}
          {/* معلومات المنتج */}
          {/* ================================================= */}

          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-400">
              {product.categoryName}
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            {/* التقييم */}

            <div className="mt-5 flex items-center gap-3">
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">
                ★ {product.rating}
              </span>

              <span className="text-sm text-slate-400">
                ({product.reviews} تقييم)
              </span>
            </div>

            {/* السعر */}

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black">
                  {product.price.toLocaleString(
                    "ar-DZ"
                  )}
                </span>

                <span className="mb-1 font-bold">
                  دج
                </span>

                {product.oldPrice && (
                  <span className="mb-1 text-sm text-slate-400 line-through">
                    {product.oldPrice.toLocaleString(
                      "ar-DZ"
                    )}{" "}
                    دج
                  </span>
                )}
              </div>
            </div>

            {/* الوصف */}

            <div className="mt-7">
              <h2 className="font-black">
                وصف المنتج
              </h2>

              <p className="mt-3 text-sm leading-8 text-slate-500">
                {product.description}
              </p>
            </div>

            {/* المخزون */}

            <div className="mt-6 rounded-xl bg-slate-100 p-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold">
                  المخزون
                </span>

                <span
                  className={
                    product.stock > 0
                      ? "font-bold text-green-600"
                      : "font-bold text-red-600"
                  }
                >
                  {product.stock > 0
                    ? `متوفر — ${product.stock} قطعة`
                    : "غير متوفر"}
                </span>
              </div>
            </div>

            {/* الكمية */}

            <div className="mt-7">
              <label className="mb-3 block text-sm font-bold">
                الكمية
              </label>

              <div className="flex h-12 w-40 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(
                        q + 1,
                        product.stock
                      )
                    )
                  }
                  disabled={
                    product.stock <= 0 ||
                    quantity >= product.stock
                  }
                  className="h-full w-12 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>

                <span className="flex flex-1 justify-center font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.max(q - 1, 1)
                    )
                  }
                  disabled={quantity <= 1}
                  className="h-full w-12 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
              </div>
            </div>

            {/* أزرار الشراء */}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex h-14 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition ${
                  product.stock <= 0
                    ? "cursor-not-allowed bg-slate-400"
                    : added
                      ? "bg-emerald-600"
                      : "bg-slate-950 hover:bg-slate-800"
                }`}
              >
                {product.stock <= 0
                  ? "المنتج غير متوفر"
                  : added
                    ? "✓ تمت الإضافة إلى السلة"
                    : "🛒 أضف إلى السلة"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                شراء الآن
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* المواصفات */}
      {/* ================================================= */}

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-2xl font-black">
            مواصفات المنتج
          </h2>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {product.features.map(
              (feature, index) => (
                <div
                  key={`${feature}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                    {index + 1}
                  </div>

                  <p className="mt-4 text-sm font-bold">
                    {feature}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-xs text-slate-400">
          © 2026 N-DIGITAL. جميع الحقوق محفوظة.
        </div>
      </footer>
    </main>
  );
}