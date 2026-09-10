"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderStatus =
  | "new"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type Order = {
  id: string;
  createdAt: string;

  customer: {
    name: string;
    phone: string;
    wilaya: string;
    municipality: string;
    address: string;
    notes: string;
  };

  delivery: {
    company: string;
    type: "home" | "office";
    price: number;
  };

  items: OrderItem[];

  subtotal: number;
  deliveryPrice: number;
  total: number;

  status: OrderStatus;
};

const statusLabels: Record<
  OrderStatus,
  string
> = {
  new: "جديد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

export default function OrdersAdminPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [filter, setFilter] =
    useState<"all" | OrderStatus>("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // تحميل الطلبات من Supabase
  // =========================================================

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: fetchError,
      } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        console.error(
          "تعذر تحميل الطلبات:",
          fetchError
        );

        setError(
          "تعذر تحميل الطلبات: " +
            fetchError.message
        );

        setOrders([]);
        return;
      }

      const normalizedOrders: Order[] =
        (data || []).map((row: any) => {
          let normalizedStatus: OrderStatus =
            "new";

          /*
           * قاعدة البيانات الجديدة تستخدم:
           * جديد
           *
           * بينما الواجهة تستخدم:
           * new
           */

          if (
            row.status === "جديد" ||
            row.status === "new"
          ) {
            normalizedStatus = "new";
          } else if (
            row.status ===
              "قيد المعالجة" ||
            row.status === "processing"
          ) {
            normalizedStatus =
              "processing";
          } else if (
            row.status === "تم الشحن" ||
            row.status === "shipped"
          ) {
            normalizedStatus =
              "shipped";
          } else if (
            row.status === "تم التسليم" ||
            row.status === "delivered"
          ) {
            normalizedStatus =
              "delivered";
          } else if (
            row.status === "ملغى" ||
            row.status === "cancelled"
          ) {
            normalizedStatus =
              "cancelled";
          }

          let items: OrderItem[] = [];

          if (Array.isArray(row.items)) {
            items = row.items.map(
              (item: any) => ({
                productId: String(
                  item.productId ??
                    item.product_id ??
                    ""
                ),

                name: String(
                  item.name ?? ""
                ),

                price: Number(
                  item.price ?? 0
                ),

                quantity: Number(
                  item.quantity ?? 0
                ),
              })
            );
          }

          return {
            id: String(row.id),

            createdAt:
              row.created_at ||
              new Date().toISOString(),

            customer: {
              name:
                row.customer_name ||
                "",

              phone:
                row.customer_phone ||
                "",

              wilaya:
                row.wilaya ||
                "",

              municipality:
                row.commune ||
                "",

              address:
                row.address ||
                "",

              notes:
                row.notes ||
                "",
            },

            delivery: {
              company:
                row.delivery_company ||
                "",

              type:
                row.delivery_type ===
                "office"
                  ? "office"
                  : "home",

              price: Number(
                row.delivery_price || 0
              ),
            },

            items,

            subtotal: Number(
              row.subtotal || 0
            ),

            deliveryPrice: Number(
              row.delivery_price || 0
            ),

            total: Number(
              row.total || 0
            ),

            status:
              normalizedStatus,
          };
        });

      setOrders(normalizedOrders);

      /*
       * إذا كان هناك طلب مفتوح في التفاصيل،
       * نحدث بياناته أيضًا.
       */
      if (selectedOrder) {
        const updatedSelected =
          normalizedOrders.find(
            (order) =>
              order.id ===
              selectedOrder.id
          );

        if (updatedSelected) {
          setSelectedOrder(
            updatedSelected
          );
        }
      }
    } catch (err) {
      console.error(
        "تعذر تحميل الطلبات:",
        err
      );

      setError(
        "حدث خطأ أثناء تحميل الطلبات."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // تشغيل تحميل الطلبات
  // =========================================================

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================================================
  // تحويل حالة الواجهة إلى حالة قاعدة البيانات
  // =========================================================

  function getDatabaseStatus(
    status: OrderStatus
  ) {
    switch (status) {
      case "new":
        return "جديد";

      case "processing":
        return "قيد المعالجة";

      case "shipped":
        return "تم الشحن";

      case "delivered":
        return "تم التسليم";

      case "cancelled":
        return "ملغى";

      default:
        return "جديد";
    }
  }

  // =========================================================
  // تحديث حالة الطلب
  // =========================================================

  async function updateStatus(
    orderId: string,
    status: OrderStatus
  ) {
    setError("");

    const databaseStatus =
      getDatabaseStatus(status);

    const {
      data,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        status: databaseStatus,
      })
      .eq("id", Number(orderId))
      .select("*")
      .single();

    if (updateError) {
      console.error(
        "تعذر تحديث حالة الطلب:",
        updateError
      );

      setError(
        "فشل تحديث حالة الطلب: " +
          updateError.message
      );

      return;
    }

    /*
     * تحديث الطلب محليًا بعد نجاح Supabase
     */

    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
            }
          : order
      )
    );

    if (
      selectedOrder &&
      selectedOrder.id === orderId
    ) {
      setSelectedOrder({
        ...selectedOrder,
        status,
      });
    }
  }

  // =========================================================
  // حذف الطلب
  // =========================================================

  async function deleteOrder(
    orderId: string
  ) {
    const confirmed =
      window.confirm(
        "هل تريد حذف هذا الطلب نهائيًا؟"
      );

    if (!confirmed) {
      return;
    }

    setError("");

    const {
      error: deleteError,
    } = await supabase
      .from("orders")
      .delete()
      .eq("id", Number(orderId));

    if (deleteError) {
      console.error(
        "تعذر حذف الطلب:",
        deleteError
      );

      setError(
        "فشل حذف الطلب: " +
          deleteError.message
      );

      return;
    }

    setOrders((previous) =>
      previous.filter(
        (order) =>
          order.id !== orderId
      )
    );

    if (
      selectedOrder &&
      selectedOrder.id === orderId
    ) {
      setSelectedOrder(null);
    }
  }

  // =========================================================
  // فلترة الطلبات
  // =========================================================

  const filteredOrders =
    useMemo(() => {
      if (filter === "all") {
        return orders;
      }

      return orders.filter(
        (order) =>
          order.status === filter
      );
    }, [orders, filter]);

  // =========================================================
  // الإحصائيات
  // =========================================================

  const statistics =
    useMemo(() => {
      return {
        total: orders.length,

        new: orders.filter(
          (order) =>
            order.status === "new"
        ).length,

        processing: orders.filter(
          (order) =>
            order.status ===
            "processing"
        ).length,

        shipped: orders.filter(
          (order) =>
            order.status === "shipped"
        ).length,

        delivered: orders.filter(
          (order) =>
            order.status ===
            "delivered"
        ).length,

        cancelled: orders.filter(
          (order) =>
            order.status ===
            "cancelled"
        ).length,
      };
    }, [orders]);

  // =========================================================
  // تنسيق التاريخ
  // =========================================================

  function formatDate(
    date: string
  ) {
    try {
      return new Date(
        date
      ).toLocaleString("ar-DZ");
    } catch {
      return date;
    }
  }

  // =========================================================
  // تنسيق السعر
  // =========================================================

  function formatPrice(
    price: number
  ) {
    return Number(
      price || 0
    ).toLocaleString("ar-DZ");
  }

  // =========================================================
  // الواجهة
  // =========================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5">
          <div>
            <h1 className="text-2xl font-black">
              لوحة التحكم
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              إدارة الطلبات
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/";
            }}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            العودة للمتجر
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
            className={`rounded-2xl border bg-white p-5 text-right ${
              filter === "all"
                ? "border-slate-950"
                : "border-slate-200"
            }`}
          >
            <div className="text-sm text-slate-400">
              كل الطلبات
            </div>

            <div className="mt-2 text-3xl font-black">
              {statistics.total}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("new")
            }
            className={`rounded-2xl border bg-white p-5 text-right ${
              filter === "new"
                ? "border-blue-500"
                : "border-slate-200"
            }`}
          >
            <div className="text-sm text-slate-400">
              جديدة
            </div>

            <div className="mt-2 text-3xl font-black">
              {statistics.new}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("processing")
            }
            className={`rounded-2xl border bg-white p-5 text-right ${
              filter === "processing"
                ? "border-amber-500"
                : "border-slate-200"
            }`}
          >
            <div className="text-sm text-slate-400">
              قيد المعالجة
            </div>

            <div className="mt-2 text-3xl font-black">
              {statistics.processing}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("shipped")
            }
            className={`rounded-2xl border bg-white p-5 text-right ${
              filter === "shipped"
                ? "border-purple-500"
                : "border-slate-200"
            }`}
          >
            <div className="text-sm text-slate-400">
              تم الشحن
            </div>

            <div className="mt-2 text-3xl font-black">
              {statistics.shipped}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("delivered")
            }
            className={`rounded-2xl border bg-white p-5 text-right ${
              filter === "delivered"
                ? "border-emerald-500"
                : "border-slate-200"
            }`}
          >
            <div className="text-sm text-slate-400">
              تم التسليم
            </div>

            <div className="mt-2 text-3xl font-black">
              {statistics.delivered}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("cancelled")
            }
            className={`rounded-2xl border bg-white p-5 text-right ${
              filter === "cancelled"
                ? "border-red-500"
                : "border-slate-200"
            }`}
          >
            <div className="text-sm text-slate-400">
              ملغاة
            </div>

            <div className="mt-2 text-3xl font-black">
              {statistics.cancelled}
            </div>
          </button>
        </div>

        {/* ===================================================
            ORDERS
        =================================================== */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black">
                الطلبات
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {filteredOrders.length} طلب
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold disabled:opacity-50"
            >
              {loading
                ? "جاري التحديث..."
                : "تحديث"}
            </button>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="py-20 text-center">
              <div className="text-5xl">
                ⏳
              </div>

              <h3 className="mt-5 text-xl font-black">
                جاري تحميل الطلبات...
              </h3>
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="py-20 text-center">
              <div className="text-6xl">
                📦
              </div>

              <h3 className="mt-5 text-xl font-black">
                لا توجد طلبات
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                ستظهر طلبات الزبائن هنا بعد إتمام عملية الشراء.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOrders.map(
                (order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* CUSTOMER */}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-black">
                            #{order.id}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              order.status ===
                              "new"
                                ? "bg-blue-100 text-blue-700"
                                : order.status ===
                                  "processing"
                                ? "bg-amber-100 text-amber-700"
                                : order.status ===
                                  "shipped"
                                ? "bg-purple-100 text-purple-700"
                                : order.status ===
                                  "delivered"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {
                              statusLabels[
                                order.status
                              ]
                            }
                          </span>
                        </div>

                        <div className="mt-3 font-bold">
                          {
                            order.customer
                              .name
                          }
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {
                            order.customer
                              .phone
                          }
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {
                            order.customer
                              .wilaya
                          }
                          {" - "}
                          {
                            order.customer
                              .municipality
                          }
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </div>
                      </div>

                      {/* DELIVERY */}

                      <div className="text-sm">
                        <div className="text-slate-400">
                          شركة التوصيل
                        </div>

                        <div className="mt-1 font-black">
                          {order.delivery
                            ?.company ||
                            "غير محددة"}
                        </div>

                        <div className="mt-1 text-slate-500">
                          {order.delivery
                            ?.type ===
                          "home"
                            ? "🚚 المنزل"
                            : "🏢 المكتب"}
                        </div>

                        <div className="mt-1 text-slate-500">
                          {formatPrice(
                            order.delivery
                              ?.price ||
                              0
                          )}{" "}
                          دج
                        </div>
                      </div>

                      {/* TOTAL */}

                      <div>
                        <div className="text-sm text-slate-400">
                          الإجمالي
                        </div>

                        <div className="mt-1 text-xl font-black">
                          {formatPrice(
                            order.total
                          )}{" "}
                          دج
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                        >
                          التفاصيل
                        </button>

                        <select
                          value={
                            order.status
                          }
                          onChange={(
                            event
                          ) =>
                            updateStatus(
                              order.id,
                              event.target
                                .value as OrderStatus
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold"
                        >
                          <option value="new">
                            جديد
                          </option>

                          <option value="processing">
                            قيد المعالجة
                          </option>

                          <option value="shipped">
                            تم الشحن
                          </option>

                          <option value="delivered">
                            تم التسليم
                          </option>

                          <option value="cancelled">
                            ملغى
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            deleteOrder(
                              order.id
                            )
                          }
                          className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
          onClick={() =>
            setSelectedOrder(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  تفاصيل الطلب
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  #{selectedOrder.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            {/* CUSTOMER */}

            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black">
                معلومات الزبون
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-slate-400">
                    الاسم
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      selectedOrder
                        .customer
                        .name
                    }
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    الهاتف
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      selectedOrder
                        .customer
                        .phone
                    }
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    الولاية
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      selectedOrder
                        .customer
                        .wilaya
                    }
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    البلدية
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      selectedOrder
                        .customer
                        .municipality
                    }
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-slate-400">
                    العنوان
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      selectedOrder
                        .customer
                        .address
                    }
                  </div>
                </div>

                {selectedOrder
                  .customer
                  .notes && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-slate-400">
                      الملاحظات
                    </div>

                    <div className="mt-1 font-bold">
                      {
                        selectedOrder
                          .customer
                          .notes
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DELIVERY */}

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black">
                معلومات التوصيل
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-slate-400">
                    الشركة
                  </div>

                  <div className="mt-1 font-bold">
                    {selectedOrder
                      .delivery
                      ?.company ||
                      "غير محددة"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    الطريقة
                  </div>

                  <div className="mt-1 font-bold">
                    {selectedOrder
                      .delivery
                      ?.type ===
                    "home"
                      ? "المنزل"
                      : "المكتب"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">
                    السعر
                  </div>

                  <div className="mt-1 font-bold">
                    {formatPrice(
                      selectedOrder
                        .delivery
                        ?.price ||
                        0
                    )}{" "}
                    دج
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCTS */}

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black">
                المنتجات
              </h3>

              <div className="mt-4 space-y-3">
                {selectedOrder.items
                  .length === 0 ? (
                  <div className="text-sm text-slate-400">
                    لا توجد تفاصيل للمنتجات.
                  </div>
                ) : (
                  selectedOrder.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <div className="font-bold">
                            {item.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            الكمية:{" "}
                            {
                              item.quantity
                            }
                          </div>
                        </div>

                        <div className="font-black">
                          {formatPrice(
                            item.price *
                              item.quantity
                          )}{" "}
                          دج
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            {/* TOTAL */}

            <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex justify-between">
                <span className="text-slate-300">
                  المنتجات
                </span>

                <span className="font-bold">
                  {formatPrice(
                    selectedOrder.subtotal
                  )}{" "}
                  دج
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-slate-300">
                  التوصيل
                </span>

                <span className="font-bold">
                  {formatPrice(
                    selectedOrder.deliveryPrice
                  )}{" "}
                  دج
                </span>
              </div>

              <div className="mt-4 border-t border-white/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black">
                    الإجمالي
                  </span>

                  <span className="text-2xl font-black">
                    {formatPrice(
                      selectedOrder.total
                    )}{" "}
                    دج
                  </span>
                </div>
              </div>
            </div>

            {/* STATUS */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold">
                حالة الطلب
              </label>

              <select
                value={
                  selectedOrder.status
                }
                onChange={(event) =>
                  updateStatus(
                    selectedOrder.id,
                    event.target
                      .value as OrderStatus
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-bold outline-none"
              >
                <option value="new">
                  جديد
                </option>

                <option value="processing">
                  قيد المعالجة
                </option>

                <option value="shipped">
                  تم الشحن
                </option>

                <option value="delivered">
                  تم التسليم
                </option>

                <option value="cancelled">
                  ملغى
                </option>
              </select>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}