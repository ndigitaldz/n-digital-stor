"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_DELIVERY_COMPANIES,
  DeliveryCompany,
  deleteDeliveryCompany,
  getDeliveryCompanies,
  saveDeliveryCompanies,
} from "@/lib/delivery";

type Municipality = {
  name: string;
};

type Daira = {
  name: string;
  communes: Municipality[];
};

type Wilaya = {
  code: number;
  name: string;
  dairas: Daira[];
};

type AlgeriaData = Wilaya[];

export default function DeliveryAdminPage() {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [wilayas, setWilayas] = useState<AlgeriaData>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] =
    useState("");

  const [homePrice, setHomePrice] = useState("");
  const [officePrice, setOfficePrice] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // تحميل شركات التوصيل من Supabase
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);

      try {
        const data = await getDeliveryCompanies();

        if (data.length > 0) {
          setCompanies(data);
        } else {
          setCompanies(DEFAULT_DELIVERY_COMPANIES);
        }
      } catch (error) {
        console.error(
          "تعذر تحميل شركات التوصيل:",
          error
        );

        setCompanies(DEFAULT_DELIVERY_COMPANIES);
        setMessage(
          "تعذر الاتصال بقاعدة البيانات"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, []);

  // تحميل بيانات الجزائر
  useEffect(() => {
    async function loadAlgeria() {
      try {
        const response = await fetch("/algeria.json");

        if (!response.ok) {
          throw new Error(
            "تعذر تحميل بيانات الجزائر"
          );
        }

        const data = await response.json();

        setWilayas(data);
      } catch (error) {
        console.error(error);

        setMessage(
          "تعذر تحميل بيانات الولايات والبلديات"
        );
      }
    }

    loadAlgeria();
  }, []);

  const currentCompany = useMemo(() => {
    return companies.find(
      (company) =>
        company.id === selectedCompany
    );
  }, [companies, selectedCompany]);

  const currentWilaya = useMemo(() => {
    return wilayas.find(
      (wilaya) =>
        String(wilaya.code) === selectedWilaya
    );
  }, [wilayas, selectedWilaya]);

  const municipalities = useMemo(() => {
    if (!currentWilaya) return [];

    const all =
      currentWilaya.dairas.flatMap(
        (daira) => daira.communes
      );

    const unique = new Map<
      string,
      Municipality
    >();

    for (const municipality of all) {
      unique.set(
        municipality.name,
        municipality
      );
    }

    return Array.from(unique.values()).sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          "ar"
        )
    );
  }, [currentWilaya]);

  const getPriceKey = () => {
    if (!selectedWilaya) return "";

    if (!selectedMunicipality) {
      return `${selectedWilaya}|||*`;
    }

    return `${selectedWilaya}|||${selectedMunicipality}`;
  };

  // تحميل السعر الموجود
  const loadExistingPrice = () => {
    if (!currentCompany) {
      setMessage(
        "اختر شركة التوصيل أولاً"
      );
      return;
    }

    const key = getPriceKey();

    if (!key) {
      setMessage("اختر الولاية");
      return;
    }

    const price =
      currentCompany.prices?.[key];

    setHomePrice(
      price?.home
        ? String(price.home)
        : ""
    );

    setOfficePrice(
      price?.office
        ? String(price.office)
        : ""
    );

    setMessage(
      price
        ? "تم تحميل الأسعار الحالية"
        : "لا توجد أسعار محفوظة لهذه الوجهة"
    );
  };

  // حفظ الأسعار في Supabase
  const savePrice = async () => {
    if (!selectedCompany) {
      setMessage(
        "اختر شركة التوصيل"
      );
      return;
    }

    if (!selectedWilaya) {
      setMessage("اختر الولاية");
      return;
    }

    const key = getPriceKey();

    if (!key) {
      setMessage("اختر الولاية");
      return;
    }

    setSaving(true);
    setMessage("جاري حفظ الأسعار...");

    try {
      const updated = companies.map(
        (company) => {
          if (
            company.id !== selectedCompany
          ) {
            return company;
          }

          return {
            ...company,
            prices: {
              ...company.prices,
              [key]: {
                home:
                  Number(homePrice) || 0,
                office:
                  Number(officePrice) || 0,
              },
            },
          };
        }
      );

      const success =
        await saveDeliveryCompanies(
          updated
        );

      if (!success) {
        setMessage(
          "تعذر حفظ الأسعار"
        );
        return;
      }

      setCompanies(updated);

      setMessage(
        "تم حفظ أسعار التوصيل بنجاح في قاعدة البيانات"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "حدث خطأ أثناء حفظ الأسعار"
      );
    } finally {
      setSaving(false);
    }
  };

  // تفعيل / إيقاف الشركة أو طريقة التوصيل
  const toggleCompany = async (
    id: string,
    field:
      | "active"
      | "homeEnabled"
      | "officeEnabled"
  ) => {
    const updated = companies.map(
      (company) =>
        company.id === id
          ? {
              ...company,
              [field]:
                !company[field],
            }
          : company
    );

    setCompanies(updated);

    const success =
      await saveDeliveryCompanies(
        updated
      );

    if (!success) {
      setMessage(
        "تعذر حفظ التغيير في قاعدة البيانات"
      );

      // إعادة البيانات السابقة
      const previous = companies;
      setCompanies(previous);

      return;
    }

    setMessage(
      "تم حفظ حالة شركة التوصيل"
    );
  };

  // إضافة شركة
  const addCompany = async () => {
    const name =
      newCompanyName.trim();

    if (!name) {
      setMessage(
        "اكتب اسم شركة التوصيل"
      );
      return;
    }

    const id =
      name
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        ) +
      "-" +
      Date.now();

    const company: DeliveryCompany = {
      id,
      name,
      active: true,
      homeEnabled: true,
      officeEnabled: true,
      prices: {},
    };

    const updated = [
      ...companies,
      company,
    ];

    setSaving(true);
    setMessage(
      "جاري إضافة الشركة..."
    );

    try {
      const success =
        await saveDeliveryCompanies(
          updated
        );

      if (!success) {
        setMessage(
          "تعذر إضافة الشركة"
        );
        return;
      }

      setCompanies(updated);
      setNewCompanyName("");

      setMessage(
        "تمت إضافة شركة التوصيل بنجاح"
      );
    } finally {
      setSaving(false);
    }
  };

  // حذف شركة
  const handleDeleteCompany = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "هل تريد حذف شركة التوصيل نهائيًا؟"
      );

    if (!confirmed) return;

    setSaving(true);
    setMessage(
      "جاري حذف الشركة..."
    );

    try {
      const success =
        await deleteDeliveryCompany(
          id
        );

      if (!success) {
        setMessage(
          "تعذر حذف الشركة"
        );
        return;
      }

      const updated =
        companies.filter(
          (company) =>
            company.id !== id
        );

      setCompanies(updated);

      if (
        selectedCompany === id
      ) {
        setSelectedCompany("");
        setHomePrice("");
        setOfficePrice("");
      }

      setMessage(
        "تم حذف شركة التوصيل"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5">
          <div>
            <h1 className="text-2xl font-black">
              لوحة التحكم
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              إدارة شركات التوصيل والأسعار
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
        {/* ADD COMPANY */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">
            إضافة شركة توصيل
          </h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={newCompanyName}
              onChange={(event) =>
                setNewCompanyName(
                  event.target.value
                )
              }
              placeholder="مثال: شركة جديدة"
              className="h-12 flex-1 rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-950"
            />

            <button
              type="button"
              onClick={addCompany}
              disabled={saving}
              className="h-12 rounded-xl bg-slate-950 px-7 font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "جاري الحفظ..."
                : "+ إضافة الشركة"}
            </button>
          </div>
        </section>

        {/* COMPANIES */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">
            شركات التوصيل
          </h2>

          {loading ? (
            <div className="py-16 text-center text-sm font-bold text-slate-400">
              جاري تحميل شركات التوصيل...
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {companies.map(
                (company) => (
                  <div
                    key={company.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {company.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {company.active
                            ? "الشركة مفعلة"
                            : "الشركة متوقفة"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleCompany(
                            company.id,
                            "active"
                          )
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          company.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {company.active
                          ? "مفعلة"
                          : "متوقفة"}
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleCompany(
                            company.id,
                            "homeEnabled"
                          )
                        }
                        className={`rounded-xl border p-3 text-sm font-bold ${
                          company.homeEnabled
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        🚚 المنزل
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleCompany(
                            company.id,
                            "officeEnabled"
                          )
                        }
                        className={`rounded-xl border p-3 text-sm font-bold ${
                          company.officeEnabled
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        🏢 المكتب
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompany(
                          company.id
                        );
                        setHomePrice("");
                        setOfficePrice("");
                        setMessage("");
                      }}
                      className="mt-4 w-full rounded-xl bg-slate-950 p-3 text-sm font-bold text-white"
                    >
                      إدارة الأسعار
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteCompany(
                          company.id
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-red-200 p-3 text-sm font-bold text-red-600"
                    >
                      حذف الشركة
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* PRICES */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">
            إدارة الأسعار
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {/* COMPANY */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                شركة التوصيل
              </label>

              <select
                value={selectedCompany}
                onChange={(event) => {
                  setSelectedCompany(
                    event.target.value
                  );

                  setHomePrice("");
                  setOfficePrice("");
                  setMessage("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-slate-950"
              >
                <option value="">
                  اختر الشركة
                </option>

                {companies
                  .filter(
                    (company) =>
                      company.active
                  )
                  .map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* WILAYA */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                الولاية
              </label>

              <select
                value={selectedWilaya}
                onChange={(event) => {
                  setSelectedWilaya(
                    event.target.value
                  );

                  setSelectedMunicipality(
                    ""
                  );

                  setHomePrice("");
                  setOfficePrice("");
                  setMessage("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-slate-950"
              >
                <option value="">
                  اختر الولاية
                </option>

                {wilayas.map(
                  (wilaya) => (
                    <option
                      key={wilaya.code}
                      value={String(
                        wilaya.code
                      )}
                    >
                      {wilaya.code} -{" "}
                      {wilaya.name}
                    </option>
                  )
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
                  !selectedWilaya
                }
                onChange={(event) => {
                  setSelectedMunicipality(
                    event.target.value
                  );

                  setHomePrice("");
                  setOfficePrice("");
                  setMessage("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none disabled:bg-slate-100 focus:border-slate-950"
              >
                <option value="">
                  {!selectedWilaya
                    ? "اختر الولاية أولاً"
                    : "كل بلديات الولاية"}
                </option>

                {municipalities.map(
                  (municipality) => (
                    <option
                      key={
                        municipality.name
                      }
                      value={
                        municipality.name
                      }
                    >
                      {
                        municipality.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* PRICE INPUTS */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">
                سعر التوصيل للمنزل بالدج
              </label>

              <input
                type="number"
                min="0"
                value={homePrice}
                onChange={(event) =>
                  setHomePrice(
                    event.target.value
                  )
                }
                placeholder="مثال: 700"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                سعر التوصيل للمكتب بالدج
              </label>

              <input
                type="number"
                min="0"
                value={officePrice}
                onChange={(event) =>
                  setOfficePrice(
                    event.target.value
                  )
                }
                placeholder="مثال: 500"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-950"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                loadExistingPrice
              }
              className="h-12 rounded-xl border border-slate-200 px-6 font-bold"
            >
              تحميل السعر الحالي
            </button>

            <button
              type="button"
              onClick={savePrice}
              disabled={saving}
              className="h-12 rounded-xl bg-slate-950 px-8 font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ الأسعار"}
            </button>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="mt-5 rounded-xl bg-slate-100 p-4 text-sm font-bold">
              {message}
            </div>
          )}

          {/* HELP */}
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm leading-7 text-amber-800">
            إذا تركت البلدية فارغة، سيتم حفظ السعر
            كسعر افتراضي لجميع بلديات الولاية.
            وإذا حددت بلدية، سيكون لها سعر خاص بها.
          </div>
        </section>
      </div>
    </main>
  );
}