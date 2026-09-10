"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type DashboardStats = {
  products: number;
  categories: number;
  orders: number;
  stock: number;
  outOfStock: number;
  lowStock: number;
};

type RecentOrder = {
  id: string | number;
  created_at?: string;
  status?: string;
  total?: number;
  customer_name?: string;
};

const initialStats: DashboardStats = {
  products: 0,
  categories: 0,
  orders: 0,
  stock: 0,
  outOfStock: 0,
  lowStock: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>(initialStats);

  const [recentOrders, setRecentOrders] =
    useState<RecentOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      /*
       * تحميل المنتجات
       */
      const productsResult = await supabase
        .from("products")
        .select("id, stock");

      /*
       * تحميل التصنيفات
       */
      const categoriesResult = await supabase
        .from("categories")
        .select("id");

      /*
       * تحميل الطلبات
       *
       * نحاول قراءة الأعمدة الأساسية.
       */
      const ordersResult = await supabase
        .from("orders")
        .select(
          "id, created_at, status, total, customer_name"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      /*
       * حساب المنتجات والمخزون
       */
      if (productsResult.error) {
        throw new Error(
          "فشل تحميل المنتجات: " +
            productsResult.error.message
        );
      }

      const products =
        productsResult.data || [];

      const totalStock = products.reduce(
        (sum, product) =>
          sum + Number(product.stock || 0),
        0
      );

      const outOfStock =
        products.filter(
          (product) =>
            Number(product.stock || 0) <= 0
        ).length;

      const lowStock =
        products.filter(
          (product) =>
            Number(product.stock || 0) > 0 &&
            Number(product.stock || 0) <= 5
        ).length;

      /*
       * التصنيفات
       */
      const categories =
        categoriesResult.error
          ? []
          : categoriesResult.data || [];

      /*
       * الطلبات
       */
      const orders =
        ordersResult.error
          ? []
          : ordersResult.data || [];

      setStats({
        products: products.length,
        categories: categories.length,
        orders: ordersResult.error
          ? 0
          : orders.length,
        stock: totalStock,
        outOfStock,
        lowStock,
      });

      setRecentOrders(
        orders as RecentOrder[]
      );

      /*
       * إذا كانت مشكلة الطلبات بسبب اختلاف
       * أعمدة جدول orders، لا نوقف لوحة التحكم.
       */
      if (ordersResult.error) {
        console.warn(
          "تعذر تحميل الطلبات:",
          ordersResult.error.message
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل لوحة التحكم."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function formatDate(
    date?: string
  ) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "ar-DZ",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function formatPrice(
    price?: number
  ) {
    return Number(
      price || 0
    ).toLocaleString("ar-DZ");
  }

  function getStatusLabel(
    status?: string
  ) {
    switch (status) {
      case "pending":
        return "قيد الانتظار";

      case "confirmed":
        return "مؤكد";

      case "processing":
        return "قيد التجهيز";

      case "shipped":
        return "تم الشحن";

      case "delivered":
        return "تم التسليم";

      case "cancelled":
        return "ملغى";

      default:
        return status || "غير محدد";
    }
  }

  function getStatusClass(
    status?: string
  ) {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "shipped":
        return "bg-blue-100 text-blue-700";

      case "confirmed":
        return "bg-indigo-100 text-indigo-700";

      case "processing":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-xl font-black text-white">
              N
            </div>

            <div>
              <h1 className="text-xl font-black">
                N-DIGITAL
              </h1>

              <p className="text-xs text-slate-400">
                لوحة تحكم الإدارة
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              العودة للمتجر
            </Link>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              تحديث
            </button>

          </div>

        </div>
      </header>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* العنوان */}

        <div className="mb-8">

          <h2 className="text-3xl font-black">
            لوحة التحكم
          </h2>

          <p className="mt-2 text-slate-500">
            مرحبًا بك في لوحة إدارة متجر N-DIGITAL
          </p>

        </div>

        {/* الخطأ */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* الإحصائيات */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* المنتجات */}

          <Link
            href="/admin/products"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📦
              </div>

              <span className="text-xs font-bold text-slate-400">
                المنتجات
              </span>

            </div>

            <div className="mt-5">

              <div className="text-3xl font-black">
                {loading
                  ? "..."
                  : stats.products}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                إدارة المنتجات والمخزون
              </p>

            </div>

          </Link>

          {/* التصنيفات */}

          <Link
            href="/admin/products"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                🏷️
              </div>

              <span className="text-xs font-bold text-slate-400">
                التصنيفات
              </span>

            </div>

            <div className="mt-5">

              <div className="text-3xl font-black">
                {loading
                  ? "..."
                  : stats.categories}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                التصنيفات الموجودة
              </p>

            </div>

          </Link>

          {/* الطلبات */}

          <Link
            href="/admin/orders"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                🛒
              </div>

              <span className="text-xs font-bold text-slate-400">
                الطلبات
              </span>

            </div>

            <div className="mt-5">

              <div className="text-3xl font-black">
                {loading
                  ? "..."
                  : stats.orders}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                إدارة ومتابعة الطلبات
              </p>

            </div>

          </Link>

          {/* المخزون */}

          <Link
            href="/admin/products"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                📊
              </div>

              <span className="text-xs font-bold text-slate-400">
                المخزون
              </span>

            </div>

            <div className="mt-5">

              <div className="text-3xl font-black">
                {loading
                  ? "..."
                  : stats.stock}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                إجمالي القطع في المخزون
              </p>

            </div>

          </Link>

        </div>

        {/* ================================================= */}
        {/* إدارة المتجر */}
        {/* ================================================= */}

        <section className="mt-8">

          <h2 className="mb-5 text-xl font-black">
            إدارة المتجر
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            {/* المنتجات */}

            <Link
              href="/admin/products"
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-400 hover:shadow-md"
            >

              <div className="text-4xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-black">
                إدارة المنتجات
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                إضافة المنتجات وتعديلها وحذفها،
                وإدارة الأسعار والمخزون والصور
                المتعددة والتصنيفات.
              </p>

              <div className="mt-5 text-sm font-bold text-blue-600">
                فتح إدارة المنتجات ←
              </div>

            </Link>

            {/* الطلبات */}

            <Link
              href="/admin/orders"
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-400 hover:shadow-md"
            >

              <div className="text-4xl">
                🛒
              </div>

              <h3 className="mt-4 text-lg font-black">
                إدارة الطلبات
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                متابعة طلبات الزبائن ومراجعة
                تفاصيل الطلبات وتحديث حالتها.
              </p>

              <div className="mt-5 text-sm font-bold text-blue-600">
                فتح إدارة الطلبات ←
              </div>

            </Link>

            {/* التوصيل */}

            <Link
              href="/admin/delivery"
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-400 hover:shadow-md"
            >

              <div className="text-4xl">
                🚚
              </div>

              <h3 className="mt-4 text-lg font-black">
                إدارة التوصيل
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                إدارة شركات التوصيل وأسعار التوصيل
                حسب الولاية والبلدية والمنزل أو المكتب.
              </p>

              <div className="mt-5 text-sm font-bold text-blue-600">
                فتح إدارة التوصيل ←
              </div>

            </Link>

          </div>

        </section>

        {/* ================================================= */}
        {/* تنبيهات المخزون */}
        {/* ================================================= */}

        <section className="mt-8">

          <h2 className="mb-5 text-xl font-black">
            حالة المخزون
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* المخزون المنخفض */}

            <Link
              href="/admin/products"
              className="rounded-2xl border border-orange-200 bg-orange-50 p-6 transition hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  ⚠️
                </div>

                <div>

                  <h3 className="font-black text-orange-900">
                    مخزون منخفض
                  </h3>

                  <p className="mt-1 text-sm text-orange-700">
                    المنتجات التي لديها 5 قطع أو أقل
                  </p>

                </div>

              </div>

              <div className="mt-5 text-3xl font-black text-orange-900">
                {loading
                  ? "..."
                  : stats.lowStock}
              </div>

            </Link>

            {/* نفد المخزون */}

            <Link
              href="/admin/products"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 transition hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-2xl">
                  🚫
                </div>

                <div>

                  <h3 className="font-black text-red-900">
                    نفد المخزون
                  </h3>

                  <p className="mt-1 text-sm text-red-700">
                    المنتجات التي لا توجد منها قطع
                  </p>

                </div>

              </div>

              <div className="mt-5 text-3xl font-black text-red-900">
                {loading
                  ? "..."
                  : stats.outOfStock}
              </div>

            </Link>

          </div>

        </section>

        {/* ================================================= */}
        {/* آخر الطلبات */}
        {/* ================================================= */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-black">
                آخر الطلبات
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                أحدث الطلبات في المتجر
              </p>

            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              عرض جميع الطلبات
            </Link>

          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400">
              جاري تحميل الطلبات...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-10 text-center text-slate-500">
              لا توجد طلبات حاليًا.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px] text-right">

                <thead>

                  <tr className="border-b border-slate-200 text-sm text-slate-500">

                    <th className="px-4 py-4 font-bold">
                      رقم الطلب
                    </th>

                    <th className="px-4 py-4 font-bold">
                      الزبون
                    </th>

                    <th className="px-4 py-4 font-bold">
                      التاريخ
                    </th>

                    <th className="px-4 py-4 font-bold">
                      المبلغ
                    </th>

                    <th className="px-4 py-4 font-bold">
                      الحالة
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentOrders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-100 last:border-0"
                      >

                        <td className="px-4 py-4 font-bold">
                          #{order.id}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {order.customer_name ||
                            "زبون"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-500">
                          {formatDate(
                            order.created_at
                          )}
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {formatPrice(
                            order.total
                          )}{" "}
                          دج
                        </td>

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(
                              order.status
                            )}
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* اختصارات */}
        {/* ================================================= */}

        <section className="mt-8">

          <h2 className="mb-5 text-xl font-black">
            اختصارات سريعة
          </h2>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/products"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              + إضافة منتج
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              🛒 الطلبات
            </Link>

            <Link
              href="/admin/delivery"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              🚚 التوصيل
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              🏪 المتجر
            </Link>

          </div>

        </section>

      </div>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="mt-12 border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-xs text-slate-400 lg:px-8">
          © 2026 N-DIGITAL — لوحة التحكم
        </div>

      </footer>

    </main>
  );
}