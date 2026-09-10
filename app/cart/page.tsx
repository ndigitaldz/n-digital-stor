"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const {
    items,
    itemCount,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const formatPrice = (price: number) =>
    price.toLocaleString("ar-DZ");

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f8fa] text-slate-900"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 lg:px-8">
          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-white">
                N
              </div>

              <div className="leading-none">
                <div className="text-xl font-black tracking-tight">
                  N-DIGITAL
                </div>

                <div className="mt-1 text-[10px] font-medium tracking-[0.25em] text-slate-400">
                  DIGITAL STORE
                </div>
              </div>
            </div>
          </Link>

          <div className="mr-auto flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              مواصلة التسوق
            </Link>

            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl text-white">
              🛒

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-950 shadow">
                {itemCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-5 pt-7 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link
            href="/"
            className="transition hover:text-slate-950"
          >
            الرئيسية
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-600">
            سلة المشتريات
          </span>
        </div>
      </div>

      {/* Page */}
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-slate-400">
            مراجعة طلبك
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            سلة المشتريات
          </h1>

          {items.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              لديك {itemCount}{" "}
              {itemCount === 1 ? "منتج" : "منتجات"} في السلة
            </p>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty cart */
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-5xl">
              🛒
            </div>

            <h2 className="mt-6 text-2xl font-black">
              سلتك فارغة
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              لم تقم بإضافة أي منتجات إلى السلة بعد.
              تصفح متجرنا واكتشف المنتجات المناسبة لك.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              ابدأ التسوق
            </Link>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
            {/* Items */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-black">
                    المنتجات
                  </h2>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-slate-400 transition hover:text-red-600"
                  >
                    إفراغ السلة
                  </button>
                </div>
              </div>

              {items.map((item) => {
                const itemTotal =
                  item.product.price * item.quantity;

                return (
                  <article
                    key={item.product.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      {/* Image */}
                      <Link
                        href={`/products/${item.product.id}`}
                        className="flex h-32 w-full shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-6xl transition hover:bg-slate-100 sm:h-32 sm:w-32"
                      >
                        {item.product.image}
                      </Link>

                      {/* Details */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              {item.product.categoryName}
                            </p>

                            <Link
                              href={`/products/${item.product.id}`}
                              className="mt-1 block text-lg font-black transition hover:text-slate-500"
                            >
                              {item.product.name}
                            </Link>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.product.id)
                            }
                            aria-label={`حذف ${item.product.name}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
                          {/* Quantity */}
                          <div>
                            <p className="mb-2 text-xs font-semibold text-slate-400">
                              الكمية
                            </p>

                            <div className="flex h-10 w-32 items-center overflow-hidden rounded-xl border border-slate-200">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                  item.product.stock
                                }
                                className="flex h-full w-10 items-center justify-center font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                +
                              </button>

                              <div className="flex flex-1 items-center justify-center text-sm font-bold">
                                {item.quantity}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1
                                  )
                                }
                                className="flex h-full w-10 items-center justify-center font-bold transition hover:bg-slate-50"
                              >
                                −
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xs text-slate-400">
                              سعر الوحدة
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              {formatPrice(item.product.price)}{" "}
                              دج
                            </p>

                            <p className="mt-1 text-xl font-black">
                              {formatPrice(itemTotal)}{" "}
                              <span className="text-xs">
                                دج
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              >
                ← مواصلة التسوق
              </Link>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">
                  ملخص الطلب
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      المنتجات
                    </span>

                    <span className="font-bold">
                      {itemCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      المجموع الفرعي
                    </span>

                    <span className="font-bold">
                      {formatPrice(total)} دج
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      التوصيل
                    </span>

                    <span className="font-bold">
                      يُحدد لاحقًا
                    </span>
                  </div>
                </div>

                <div className="my-6 border-t border-slate-100" />

                <div className="flex items-end justify-between">
                  <span className="font-bold">
                    الإجمالي
                  </span>

                  <div className="text-right">
                    <div className="text-2xl font-black">
                      {formatPrice(total)}{" "}
                      <span className="text-sm">
                        دج
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-400">
                      شامل أسعار المنتجات
                    </p>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-7 flex h-14 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  متابعة الطلب
                </Link>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="text-lg">
                      🔒
                    </span>

                    <div>
                      <p className="text-xs font-bold">
                        دفع آمن
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        حماية معلوماتك
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="text-lg">
                      🚚
                    </span>

                    <div>
                      <p className="text-xs font-bold">
                        توصيل سريع
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        إلى جميع الولايات
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © 2026 N-DIGITAL. جميع الحقوق محفوظة.
          </p>

          <p>
            متجر إلكتروني حديث ومتجاوب
          </p>
        </div>
      </footer>
    </main>
  );
}