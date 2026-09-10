"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useCart } from "@/lib/cart-context";

import {
  getDeliveryCompanies,
  getDeliveryPrice,
  type DeliveryCompany,
} from "@/lib/delivery";

import { supabase } from "@/lib/supabase";

type Municipality = {
  name?: string;
  name_ar?: string;
  arabic_name?: string;
};

type Daira = {
  name?: string;
  name_ar?: string;
  communes?: Municipality[];
  municipalities?: Municipality[];
};

type Wilaya = {
  id?: number | string;
  code?: number | string;
  name?: string;
  name_ar?: string;
  arabic_name?: string;
  communes?: Municipality[];
  municipalities?: Municipality[];
  baladiyat?: Municipality[];
  dairas?: Daira[];
};

type AlgeriaData = Wilaya[];

export default function CheckoutPage() {
  const {
    items,
    itemCount,
    total,
    clearCart,
  } = useCart();

  const [wilayas, setWilayas] =
    useState<AlgeriaData>([]);

  const [companies, setCompanies] =
    useState<DeliveryCompany[]>([]);

  const [loadingWilayas, setLoadingWilayas] =
    useState(true);

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [selectedWilaya, setSelectedWilaya] =
    useState("");

  const [
    selectedMunicipality,
    setSelectedMunicipality,
  ] = useState("");

  const [selectedCompany, setSelectedCompany] =
    useState("");

  const [deliveryType, setDeliveryType] =
    useState<"home" | "office">("home");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  // =========================================================
  // تحميل الولايات + شركات التوصيل
  // =========================================================

  useEffect(() => {
    async function loadData() {
      // -----------------------------
      // تحميل الولايات والبلديات
      // -----------------------------

      try {
        const response = await fetch(
          "/algeria.json",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "تعذر تحميل بيانات الجزائر"
          );
        }

        const data = await response.json();

        let list: Wilaya[] = [];

        if (Array.isArray(data)) {
          list = data;
        } else if (
          Array.isArray(data.wilayas)
        ) {
          list = data.wilayas;
        } else if (
          Array.isArray(data.data)
        ) {
          list = data.data;
        } else if (
          Array.isArray(data.results)
        ) {
          list = data.results;
        }

        setWilayas(list);
      } catch (error) {
        console.error(
          "تعذر تحميل الولايات:",
          error
        );
      } finally {
        setLoadingWilayas(false);
      }

      // -----------------------------
      // تحميل شركات التوصيل
      // -----------------------------

      try {
        const deliveryCompanies =
          await getDeliveryCompanies();

        if (
          Array.isArray(deliveryCompanies)
        ) {
          setCompanies(
            deliveryCompanies
          );
        } else {
          console.error(
            "بيانات شركات التوصيل ليست مصفوفة:",
            deliveryCompanies
          );

          setCompanies([]);
        }
      } catch (error) {
        console.error(
          "تعذر تحميل شركات التوصيل:",
          error
        );

        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    }

    loadData();
  }, []);

  // =========================================================
  // اسم الولاية
  // =========================================================

  const getWilayaName = (
    wilaya: Wilaya
  ) => {
    return (
      wilaya.name_ar ||
      wilaya.arabic_name ||
      wilaya.name ||
      `الولاية ${
        wilaya.code ||
        wilaya.id ||
        ""
      }`
    );
  };

  // =========================================================
  // اسم البلدية
  // =========================================================

  const getMunicipalityName = (
    municipality: Municipality
  ) => {
    return (
      municipality.name_ar ||
      municipality.arabic_name ||
      municipality.name ||
      ""
    );
  };

  // =========================================================
  // الولاية المختارة
  // =========================================================

  const selectedWilayaObject =
    useMemo(() => {
      return wilayas.find(
        (wilaya) =>
          String(wilaya.id ?? "") ===
            selectedWilaya ||
          String(wilaya.code ?? "") ===
            selectedWilaya
      );
    }, [
      wilayas,
      selectedWilaya,
    ]);

  // =========================================================
  // البلديات التابعة للولاية
  // =========================================================

  const municipalities =
    useMemo(() => {
      if (!selectedWilayaObject) {
        return [];
      }

      let result: Municipality[] = [];

      if (
        Array.isArray(
          selectedWilayaObject.communes
        )
      ) {
        result =
          selectedWilayaObject.communes;
      }

      if (
        Array.isArray(
          selectedWilayaObject.municipalities
        )
      ) {
        result =
          selectedWilayaObject.municipalities;
      }

      if (
        Array.isArray(
          selectedWilayaObject.baladiyat
        )
      ) {
        result =
          selectedWilayaObject.baladiyat;
      }

      if (
        Array.isArray(
          selectedWilayaObject.dairas
        )
      ) {
        result =
          selectedWilayaObject.dairas.flatMap(
            (daira) =>
              daira.communes ||
              daira.municipalities ||
              []
          );
      }

      const unique =
        new Map<
          string,
          Municipality
        >();

      result.forEach(
        (municipality) => {
          const name =
            getMunicipalityName(
              municipality
            );

          if (name) {
            unique.set(
              name,
              municipality
            );
          }
        }
      );

      return Array.from(
        unique.values()
      ).sort((a, b) =>
        getMunicipalityName(
          a
        ).localeCompare(
          getMunicipalityName(b),
          "ar"
        )
      );
    }, [selectedWilayaObject]);

  // =========================================================
  // شركات التوصيل المفعلة
  // =========================================================

  const activeCompanies =
    useMemo(() => {
      if (!Array.isArray(companies)) {
        return [];
      }

      return companies.filter(
        (company) =>
          company.active
      );
    }, [companies]);

  // =========================================================
  // شركة التوصيل المختارة
  // =========================================================

  const currentCompany =
    useMemo(() => {
      if (!Array.isArray(companies)) {
        return undefined;
      }

      return companies.find(
        (company) =>
          company.id ===
          selectedCompany
      );
    }, [
      companies,
      selectedCompany,
    ]);

  // =========================================================
  // سعر التوصيل
  // =========================================================

  const deliveryPrice =
    useMemo(() => {
      if (
        !currentCompany ||
        !selectedWilaya ||
        !selectedMunicipality
      ) {
        return 0;
      }

      return getDeliveryPrice(
        currentCompany,
        selectedWilaya,
        selectedMunicipality,
        deliveryType
      );
    }, [
      currentCompany,
      selectedWilaya,
      selectedMunicipality,
      deliveryType,
    ]);

  // =========================================================
  // المجموع النهائي
  // =========================================================

  const finalTotal =
    total + deliveryPrice;

  // =========================================================
  // تغيير الولاية
  // =========================================================

  const handleWilayaChange = (
    value: string
  ) => {
    setSelectedWilaya(value);

    setSelectedMunicipality("");

    setSelectedCompany("");

    setDeliveryType("home");
  };

  // =========================================================
  // إرسال الطلب
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    // -----------------------------
    // التحقق من السلة
    // -----------------------------

    if (items.length === 0) {
      alert("السلة فارغة");
      return;
    }

    // -----------------------------
    // الاسم
    // -----------------------------

    if (!form.name.trim()) {
      alert(
        "يرجى إدخال الاسم الكامل"
      );
      return;
    }

    // -----------------------------
    // الهاتف
    // -----------------------------

    if (!form.phone.trim()) {
      alert(
        "يرجى إدخال رقم الهاتف"
      );
      return;
    }

    // -----------------------------
    // الولاية
    // -----------------------------

    if (!selectedWilaya) {
      alert(
        "يرجى اختيار الولاية"
      );
      return;
    }

    // -----------------------------
    // البلدية
    // -----------------------------

    if (!selectedMunicipality) {
      alert(
        "يرجى اختيار البلدية"
      );
      return;
    }

    // -----------------------------
    // شركة التوصيل
    // -----------------------------

    if (!selectedCompany) {
      alert(
        "يرجى اختيار شركة التوصيل"
      );
      return;
    }

    // -----------------------------
    // العنوان
    // -----------------------------

    if (!form.address.trim()) {
      alert(
        "يرجى إدخال العنوان"
      );
      return;
    }

    // -----------------------------
    // سعر التوصيل
    // -----------------------------

    if (deliveryPrice <= 0) {
      alert(
        "لم يتم تحديد سعر التوصيل لهذه الوجهة. يرجى اختيار شركة أخرى أو التواصل مع المتجر."
      );
      return;
    }

    const wilayaName =
      selectedWilayaObject
        ? getWilayaName(
            selectedWilayaObject
          )
        : selectedWilaya;

    const deliveryName =
      currentCompany?.name || "";

    // -----------------------------
    // منع الضغط المتكرر
    // -----------------------------

    setSubmitting(true);

    try {
      // =====================================================
      // تجهيز المنتجات
      // =====================================================

      const orderItems =
        items.map((item) => ({
          productId:
            item.product.id,

          name:
            item.product.name,

          price:
            item.product.price,

          quantity:
            item.quantity,
        }));

      // =====================================================
      // إنشاء الطلب في Supabase
      // =====================================================

      const {
        data: savedOrder,
        error,
      } = await supabase
        .from("orders")
        .insert({
          customer_name:
            form.name.trim(),

          customer_phone:
            form.phone.trim(),

          wilaya:
            wilayaName,

          commune:
            selectedMunicipality,

          address:
            form.address.trim(),

          delivery_type:
            deliveryType,

          delivery_company:
            deliveryName,

          delivery_price:
            deliveryPrice,

          subtotal:
            total,

          total:
            finalTotal,

          status:
            "جديد",

          items:
            orderItems,

          notes:
            form.notes.trim(),
        })
        .select("id")
        .single();

      // =====================================================
      // التحقق من خطأ Supabase
      // =====================================================

      if (error) {
        console.error(
          "تعذر حفظ الطلب في Supabase:",
          error
        );

        alert(
          `حدث خطأ أثناء تسجيل الطلب.\n\n${error.message}`
        );

        setSubmitting(false);

        return;
      }

      // =====================================================
      // رقم الطلب
      // =====================================================

      const orderId =
        savedOrder?.id;

      const orderNumber =
        orderId
          ? `ND-${orderId}`
          : "ND";

      // =====================================================
      // رسالة النجاح
      // =====================================================

      alert(
        `تم تسجيل طلبك بنجاح 🎉

رقم الطلب: ${orderNumber}

الاسم: ${form.name}

الهاتف: ${form.phone}

الولاية: ${wilayaName}

البلدية: ${selectedMunicipality}

شركة التوصيل: ${deliveryName}

طريقة التوصيل: ${
          deliveryType === "home"
            ? "التوصيل إلى المنزل"
            : "التوصيل إلى المكتب"
        }

سعر التوصيل: ${deliveryPrice.toLocaleString(
          "ar-DZ"
        )} دج

الإجمالي: ${finalTotal.toLocaleString(
          "ar-DZ"
        )} دج`
      );

      // =====================================================
      // تفريغ السلة بعد نجاح الحفظ فقط
      // =====================================================

      clearCart();

      // =====================================================
      // العودة إلى المتجر
      // =====================================================

      window.location.href = "/";
    } catch (error) {
      console.error(
        "تعذر حفظ الطلب:",
        error
      );

      alert(
        "حدث خطأ أثناء تسجيل الطلب. يرجى المحاولة مرة أخرى."
      );

      setSubmitting(false);
    }
  };

  // =========================================================
  // إذا كانت السلة فارغة
  // =========================================================

  if (items.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50"
      >
        <header className="border-b bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/";
              }}
              className="text-xl font-black"
            >
              N-DIGITAL
            </button>

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

        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <div className="text-center">
            <div className="text-7xl">
              🛒
            </div>

            <h1 className="mt-6 text-3xl font-black">
              السلة فارغة
            </h1>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/";
              }}
              className="mt-7 rounded-xl bg-slate-950 px-7 py-4 font-bold text-white"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // الصفحة الرئيسية
  // =========================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/";
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 font-black text-white">
              N
            </div>

            <div className="text-right">
              <div className="text-xl font-black">
                N-DIGITAL
              </div>

              <div className="text-[10px] tracking-[0.2em] text-slate-400">
                DIGITAL STORE
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/cart";
            }}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold"
          >
            🛒 السلة ({itemCount})
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold text-slate-400">
            N-DIGITAL
          </p>

          <h1 className="mt-2 text-3xl font-black">
            إتمام الطلب
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            اختر شركة التوصيل وطريقة استلام طلبك.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
          >
            <h2 className="mb-6 text-xl font-black">
              معلومات التوصيل
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* NAME */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  الاسم الكامل
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target.value,
                    })
                  }
                  placeholder="أدخل اسمك الكامل"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-950"
                />
              </div>

              {/* PHONE */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target.value,
                    })
                  }
                  placeholder="05XXXXXXXX"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-right outline-none focus:border-slate-950"
                />
              </div>

              {/* WILAYA */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  الولاية
                </label>

                <select
                  value={
                    selectedWilaya
                  }
                  onChange={(e) =>
                    handleWilayaChange(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingWilayas
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-slate-950"
                >
                  <option value="">
                    {loadingWilayas
                      ? "جاري تحميل الولايات..."
                      : "اختر الولاية"}
                  </option>

                  {wilayas.map(
                    (
                      wilaya,
                      index
                    ) => {
                      const value =
                        String(
                          wilaya.id ??
                            wilaya.code ??
                            index
                        );

                      return (
                        <option
                          key={value}
                          value={value}
                        >
                          {getWilayaName(
                            wilaya
                          )}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              {/* MUNICIPALITY */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  البلدية
                </label>

                <select
                  value={
                    selectedMunicipality
                  }
                  disabled={
                    !selectedWilaya ||
                    municipalities.length ===
                      0
                  }
                  onChange={(e) =>
                    setSelectedMunicipality(
                      e.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none disabled:bg-slate-100 focus:border-slate-950"
                >
                  <option value="">
                    {!selectedWilaya
                      ? "اختر الولاية أولاً"
                      : "اختر البلدية"}
                  </option>

                  {municipalities.map(
                    (
                      municipality,
                      index
                    ) => {
                      const name =
                        getMunicipalityName(
                          municipality
                        );

                      return (
                        <option
                          key={`${name}-${index}`}
                          value={name}
                        >
                          {name}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              {/* DELIVERY COMPANY */}

              <div className="sm:col-span-2">
                <label className="mb-3 block text-sm font-bold">
                  شركة التوصيل
                </label>

                {loadingCompanies ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                    جاري تحميل شركات التوصيل...
                  </div>
                ) : activeCompanies.length ===
                  0 ? (
                  <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                    لا توجد شركات توصيل مفعلة.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeCompanies.map(
                      (company) => {
                        const price =
                          selectedWilaya &&
                          selectedMunicipality
                            ? getDeliveryPrice(
                                company,
                                selectedWilaya,
                                selectedMunicipality,
                                deliveryType
                              )
                            : 0;

                        return (
                          <button
                            key={
                              company.id
                            }
                            type="button"
                            disabled={
                              !selectedWilaya ||
                              !selectedMunicipality
                            }
                            onClick={() =>
                              setSelectedCompany(
                                company.id
                              )
                            }
                            className={`rounded-2xl border-2 p-4 text-right transition ${
                              selectedCompany ===
                              company.id
                                ? "border-slate-950 bg-slate-50"
                                : "border-slate-200 bg-white"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-black">
                                {
                                  company.name
                                }
                              </span>

                              {selectedWilaya &&
                                selectedMunicipality && (
                                  <span className="text-sm font-black">
                                    {price >
                                    0
                                      ? `${price.toLocaleString(
                                          "ar-DZ"
                                        )} دج`
                                      : "السعر غير محدد"}
                                  </span>
                                )}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {!selectedWilaya ||
                !selectedMunicipality ? (
                  <p className="mt-3 text-xs text-slate-400">
                    اختر الولاية والبلدية أولاً لعرض سعر كل شركة.
                  </p>
                ) : null}
              </div>

              {/* DELIVERY TYPE */}

              {currentCompany && (
                <div className="sm:col-span-2">
                  <label className="mb-3 block text-sm font-bold">
                    طريقة التوصيل
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentCompany.homeEnabled && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveryType(
                            "home"
                          )
                        }
                        className={`rounded-2xl border-2 p-5 text-right ${
                          deliveryType ===
                          "home"
                            ? "border-slate-950 bg-slate-50"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="text-lg">
                          🚚
                        </div>

                        <div className="mt-2 font-black">
                          التوصيل إلى المنزل
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {getDeliveryPrice(
                            currentCompany,
                            selectedWilaya,
                            selectedMunicipality,
                            "home"
                          ).toLocaleString(
                            "ar-DZ"
                          )}{" "}
                          دج
                        </div>
                      </button>
                    )}

                    {currentCompany.officeEnabled && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveryType(
                            "office"
                          )
                        }
                        className={`rounded-2xl border-2 p-5 text-right ${
                          deliveryType ===
                          "office"
                            ? "border-slate-950 bg-slate-50"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="text-lg">
                          🏢
                        </div>

                        <div className="mt-2 font-black">
                          المكتب / Stop Desk
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {getDeliveryPrice(
                            currentCompany,
                            selectedWilaya,
                            selectedMunicipality,
                            "office"
                          ).toLocaleString(
                            "ar-DZ"
                          )}{" "}
                          دج
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ADDRESS */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  العنوان بالتفصيل
                </label>

                <textarea
                  value={
                    form.address
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address:
                        e.target.value,
                    })
                  }
                  placeholder="الحي، الشارع، رقم المنزل..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 p-4 outline-none focus:border-slate-950"
                />
              </div>

              {/* NOTES */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  ملاحظات إضافية
                  <span className="mr-2 text-xs font-normal text-slate-400">
                    اختياري
                  </span>
                </label>

                <textarea
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                  placeholder="أي ملاحظة خاصة بالطلب..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 p-4 outline-none focus:border-slate-950"
                />
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                submitting ||
                loadingCompanies
              }
              className="mt-8 h-14 w-full rounded-xl bg-slate-950 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "جاري تسجيل الطلب..."
                : "تأكيد الطلب"}
            </button>
          </form>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black">
              ملخص الطلب
            </h2>

            <div className="mt-6 space-y-4">
              {items.map(
                (item) => (
                  <div
                    key={
                      item.product.id
                    }
                    className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
                  >
                    <div className="min-w-0">
                      <div className="font-bold">
                        {
                          item.product
                            .name
                        }
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        الكمية:{" "}
                        {
                          item.quantity
                        }
                      </div>
                    </div>

                    <div className="shrink-0 font-black">
                      {(
                        item.product
                          .price *
                        item.quantity
                      ).toLocaleString(
                        "ar-DZ"
                      )}{" "}
                      دج
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-6 space-y-4">
              {/* ITEM COUNT */}

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  عدد المنتجات
                </span>

                <span className="font-bold">
                  {itemCount}
                </span>
              </div>

              {/* COMPANY */}

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  شركة التوصيل
                </span>

                <span className="font-bold">
                  {currentCompany
                    ? currentCompany.name
                    : "لم يتم الاختيار"}
                </span>
              </div>

              {/* DELIVERY */}

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  التوصيل
                </span>

                <span className="font-bold">
                  {deliveryPrice >
                  0
                    ? `${deliveryPrice.toLocaleString(
                        "ar-DZ"
                      )} دج`
                    : "—"}
                </span>
              </div>

              {/* TOTAL */}

              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    إجمالي المنتجات
                  </span>

                  <span className="font-black">
                    {total.toLocaleString(
                      "ar-DZ"
                    )}{" "}
                    دج
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-black">
                    الإجمالي النهائي
                  </span>

                  <span className="text-2xl font-black">
                    {finalTotal.toLocaleString(
                      "ar-DZ"
                    )}{" "}
                    دج
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}