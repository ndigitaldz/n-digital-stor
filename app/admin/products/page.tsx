"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  images?: string[] | null;
  description: string;
  features: string[];
  rating: number;
  reviews: number;
  stock: number;
  badge?: string | null;
};

type Category = {
  id: number;
  name: string;
  created_at?: string;
};

type ProductForm = {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: string;
  oldPrice: string;
  description: string;
  features: string;
  rating: string;
  reviews: string;
  stock: string;
  badge: string;
};

const emptyForm: ProductForm = {
  id: "",
  name: "",
  category: "",
  categoryName: "",
  price: "",
  oldPrice: "",
  description: "",
  features: "",
  rating: "5",
  reviews: "0",
  stock: "0",
  badge: "",
};

function createCategoryValue(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  /*
   * الصور الجديدة التي اختارها المستخدم من الكمبيوتر
   */
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  /*
   * معاينات الصور الجديدة
   */
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  /*
   * الصور الموجودة أصلًا في المنتج أثناء التعديل
   */
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // تحميل المنتجات والتصنيفات
  // =========================================================

  async function loadData() {
    setLoading(true);
    setError("");

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    if (productsResult.error) {
      setError(
        "حدث خطأ أثناء تحميل المنتجات: " +
          productsResult.error.message
      );
    } else {
      setProducts((productsResult.data || []) as Product[]);
    }

    if (categoriesResult.error) {
      setError(
        "حدث خطأ أثناء تحميل التصنيفات: " +
          categoriesResult.error.message
      );
    } else {
      setCategories(
        (categoriesResult.data || []) as Category[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // اختيار عدة صور من الكمبيوتر
  // =========================================================

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setError("الرجاء اختيار ملفات صور فقط.");
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {
      setError(
        "حجم كل صورة يجب ألا يتجاوز 5 ميغابايت."
      );
      return;
    }

    setError("");
    setMessage("");

    const newPreviews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setImageFiles((previous) => [
      ...previous,
      ...files,
    ]);

    setImagePreviews((previous) => [
      ...previous,
      ...newPreviews,
    ]);

    /*
     * حتى يستطيع المستخدم اختيار نفس الصورة مرة أخرى
     */
    event.target.value = "";
  }

  // =========================================================
  // حذف صورة جديدة قبل الحفظ
  // =========================================================

  function removeNewImage(index: number) {
    setImageFiles((previous) =>
      previous.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );

    setImagePreviews((previous) => {
      const url = previous[index];

      if (url) {
        URL.revokeObjectURL(url);
      }

      return previous.filter(
        (_, itemIndex) => itemIndex !== index
      );
    });
  }

  // =========================================================
  // حذف صورة موجودة أثناء التعديل
  // =========================================================

  function removeExistingImage(index: number) {
    setExistingImages((previous) =>
      previous.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  }

  // =========================================================
  // جعل صورة موجودة هي الصورة الرئيسية
  // =========================================================

  function makeExistingImageMain(index: number) {
    setExistingImages((previous) => {
      if (index <= 0) {
        return previous;
      }

      const copy = [...previous];
      const [selected] = copy.splice(index, 1);

      return [selected, ...copy];
    });
  }

  // =========================================================
  // رفع الصور الجديدة إلى Supabase Storage
  // =========================================================

  async function uploadProductImages() {
    if (imageFiles.length === 0) {
      return [];
    }

    const uploadedUrls: string[] = [];

    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(
          /[^a-zA-Z0-9\u0600-\u06FF-_]/g,
          "-"
        )
        .slice(0, 50);

      const fileName =
        `${Date.now()}-${index}-${safeName}.${extension}`;

      const filePath = `products/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(
          "فشل رفع الصورة رقم " +
            (index + 1) +
            ": " +
            uploadError.message
        );
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  // =========================================================
  // تغيير الحقول
  // =========================================================

  function updateForm(
    field: keyof ProductForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // =========================================================
  // اختيار التصنيف
  // =========================================================

  function handleCategoryChange(value: string) {
    const selectedCategory = categories.find(
      (category) =>
        createCategoryValue(category.name) === value
    );

    setForm((previous) => ({
      ...previous,
      category: value,
      categoryName:
        selectedCategory?.name || "",
    }));
  }

  // =========================================================
  // إضافة تصنيف
  // =========================================================

  async function handleAddCategory() {
    const name = categoryName.trim();

    if (!name) {
      setError("اكتب اسم التصنيف أولاً.");
      return;
    }

    setAddingCategory(true);
    setError("");
    setMessage("");

    const { data, error: insertError } =
      await supabase
        .from("categories")
        .insert({
          name,
        })
        .select()
        .single();

    if (insertError) {
      if (insertError.code === "23505") {
        setError("هذا التصنيف موجود بالفعل.");
      } else {
        setError(
          "فشل إضافة التصنيف: " +
            insertError.message
        );
      }

      setAddingCategory(false);
      return;
    }

    setCategories((previous) =>
      [...previous, data as Category].sort(
        (a, b) =>
          a.name.localeCompare(b.name, "ar")
      )
    );

    setCategoryName("");
    setMessage("تمت إضافة التصنيف بنجاح.");
    setAddingCategory(false);
  }

  // =========================================================
  // حذف تصنيف
  // =========================================================

  async function handleDeleteCategory(
    category: Category
  ) {
    const usedByProducts = products.some(
      (product) =>
        product.categoryName === category.name
    );

    if (usedByProducts) {
      setError(
        "لا يمكن حذف هذا التصنيف لأنه مستخدم من طرف منتج واحد أو أكثر."
      );
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف التصنيف "${category.name}"؟`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    const { error: deleteError } =
      await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

    if (deleteError) {
      setError(
        "فشل حذف التصنيف: " +
          deleteError.message
      );
      return;
    }

    setCategories((previous) =>
      previous.filter(
        (item) => item.id !== category.id
      )
    );

    if (form.categoryName === category.name) {
      setForm((previous) => ({
        ...previous,
        category: "",
        categoryName: "",
      }));
    }

    setMessage("تم حذف التصنيف بنجاح.");
  }

  // =========================================================
  // بدء تعديل منتج
  // =========================================================

  function handleEditProduct(product: Product) {
    setEditing(true);

    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      categoryName: product.categoryName,

      price: String(product.price),

      oldPrice:
        product.oldPrice !== null &&
        product.oldPrice !== undefined
          ? String(product.oldPrice)
          : "",

      description:
        product.description || "",

      features: Array.isArray(product.features)
        ? product.features.join("\n")
        : "",

      rating: String(product.rating ?? 5),

      reviews: String(product.reviews ?? 0),

      stock: String(product.stock ?? 0),

      badge: product.badge || "",
    });

    /*
     * إذا كان المنتج القديم لا يحتوي على images
     * نستخدم image القديمة تلقائيًا.
     */
    const productImages =
      Array.isArray(product.images) &&
      product.images.length > 0
        ? product.images
        : product.image
          ? [product.image]
          : [];

    setExistingImages(productImages);

    /*
     * إلغاء أي صور جديدة كانت مختارة سابقًا
     */
    imagePreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setImageFiles([]);
    setImagePreviews([]);

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================================================
  // إلغاء التعديل
  // =========================================================

  function handleCancelEdit() {
    imagePreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setEditing(false);
    setForm(emptyForm);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setMessage("");
    setError("");
  }

  // =========================================================
  // حفظ المنتج
  // =========================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      // -----------------------------------------------------
      // التحقق من البيانات
      // -----------------------------------------------------

      if (!form.name.trim()) {
        throw new Error("اكتب اسم المنتج.");
      }

      if (!form.category) {
        throw new Error("اختر تصنيف المنتج.");
      }

      if (!form.price || Number(form.price) <= 0) {
        throw new Error("أدخل سعر المنتج.");
      }

      if (!form.stock || Number(form.stock) < 0) {
        throw new Error(
          "أدخل كمية المخزون بشكل صحيح."
        );
      }

      const selectedCategory = categories.find(
        (category) =>
          createCategoryValue(category.name) ===
          form.category
      );

      const finalCategoryName =
        selectedCategory?.name ||
        form.categoryName;

      if (!finalCategoryName) {
        throw new Error("التصنيف غير صحيح.");
      }

      // -----------------------------------------------------
      // رفع الصور الجديدة
      // -----------------------------------------------------

      const newImageUrls =
        await uploadProductImages();

      /*
       * الصور النهائية:
       * الصور الموجودة + الصور الجديدة
       */
      const allImages = [
        ...existingImages,
        ...newImageUrls,
      ];

      /*
       * عند إضافة منتج جديد يجب وجود صورة
       */
      if (
        !editing &&
        allImages.length === 0
      ) {
        throw new Error(
          "اختر صورة واحدة على الأقل للمنتج."
        );
      }

      /*
       * أثناء التعديل لا نسمح بحفظ المنتج بدون صور
       */
      if (
        editing &&
        allImages.length === 0
      ) {
        throw new Error(
          "يجب أن يحتوي المنتج على صورة واحدة على الأقل."
        );
      }

      /*
       * أول صورة هي الصورة الرئيسية
       */
      const imageUrl =
        allImages[0] || "";

      // -----------------------------------------------------
      // بيانات المنتج
      // -----------------------------------------------------

      const productData = {
        name: form.name.trim(),

        category: form.category,

        categoryName: finalCategoryName,

        price: Number(form.price),

        oldPrice: form.oldPrice
          ? Number(form.oldPrice)
          : null,

        /*
         * الحقل القديم يبقى محفوظًا
         * حتى لا تتعطل الصفحات القديمة.
         */
        image: imageUrl,

        /*
         * جميع الصور
         */
        images: allImages,

        description:
          form.description.trim(),

        features: form.features
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        rating:
          Number(form.rating) || 0,

        reviews:
          Number(form.reviews) || 0,

        stock:
          Number(form.stock) || 0,

        badge:
          form.badge.trim() || null,
      };

      // =====================================================
      // تعديل منتج موجود
      // =====================================================

      if (editing) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("products")
          .update(productData)
          .eq("id", form.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(
            "فشل تعديل المنتج: " +
              updateError.message
          );
        }

        setProducts((previous) =>
          previous.map((product) =>
            product.id === form.id
              ? (data as Product)
              : product
          )
        );

        setMessage(
          "تم تعديل المنتج بنجاح."
        );
      }

      // =====================================================
      // إضافة منتج جديد
      // =====================================================

      else {
        const newId =
          form.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(
              /[^a-zA-Z0-9\u0600-\u06FF-]/g,
              ""
            )
            .slice(0, 50) +
          "-" +
          Date.now();

        const {
          data,
          error: insertError,
        } = await supabase
          .from("products")
          .insert({
            id: newId,
            ...productData,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(
            "فشل إضافة المنتج: " +
              insertError.message
          );
        }

        setProducts((previous) => [
          data as Product,
          ...previous,
        ]);

        setMessage(
          "تمت إضافة المنتج بنجاح."
        );
      }

      // -----------------------------------------------------
      // تنظيف النموذج
      // -----------------------------------------------------

      imagePreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      setForm(emptyForm);
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // حذف منتج
  // =========================================================

  async function handleDeleteProduct(
    product: Product
  ) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المنتج "${product.name}"؟`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    const {
      error: deleteError,
    } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(
        "فشل حذف المنتج: " +
          deleteError.message
      );
      return;
    }

    setProducts((previous) =>
      previous.filter(
        (item) => item.id !== product.id
      )
    );

    if (form.id === product.id) {
      handleCancelEdit();
    }

    setMessage(
      "تم حذف المنتج بنجاح."
    );
  }

  // =========================================================
  // إحصائيات
  // =========================================================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0),
    0
  );

  const outOfStock = products.filter(
    (product) =>
      Number(product.stock || 0) <= 0
  ).length;

  // =========================================================
  // الواجهة
  // =========================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* العنوان */}
        {/* ================================================= */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            إدارة المنتجات
          </h1>

          <p className="mt-2 text-slate-500">
            إضافة وتعديل وحذف المنتجات وإدارة
            المخزون والتصنيفات والصور.
          </p>
        </div>

        {/* ================================================= */}
        {/* الرسائل */}
        {/* ================================================= */}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* الإحصائيات */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">
              عدد المنتجات
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-900">
              {totalProducts}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">
              إجمالي المخزون
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-900">
              {totalStock}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">
              منتجات نفد مخزونها
            </div>

            <div className="mt-2 text-3xl font-bold text-red-600">
              {outOfStock}
            </div>
          </div>

        </div>

        {/* ================================================= */}
        {/* إدارة التصنيفات */}
        {/* ================================================= */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-2 text-xl font-bold text-slate-900">
            إدارة التصنيفات
          </h2>

          <p className="mb-5 text-sm text-slate-500">
            أضف التصنيفات التي تريدها، وستظهر
            تلقائيًا عند إضافة المنتجات.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">

            <input
              type="text"
              value={categoryName}
              onChange={(event) =>
                setCategoryName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddCategory();
                }
              }}
              placeholder="مثال: الهواتف المستعملة"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
            />

            <button
              type="button"
              onClick={handleAddCategory}
              disabled={addingCategory}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingCategory
                ? "جاري الإضافة..."
                : "إضافة التصنيف"}
            </button>

          </div>

          {/* قائمة التصنيفات */}

          <div className="mt-6 flex flex-wrap gap-3">

            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2"
              >

                <span className="font-medium text-slate-700">
                  {category.name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteCategory(
                      category
                    )
                  }
                  className="text-sm font-bold text-red-500 hover:text-red-700"
                  title="حذف التصنيف"
                >
                  ×
                </button>

              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-sm text-slate-500">
                لا توجد تصنيفات.
              </p>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* نموذج المنتج */}
        {/* ================================================= */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                {editing
                  ? "تعديل المنتج"
                  : "إضافة منتج جديد"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                أدخل معلومات المنتج ثم اضغط حفظ.
              </p>

            </div>

            {editing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                إلغاء التعديل
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ================================================= */}
            {/* الاسم والتصنيف */}
            {/* ================================================= */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  اسم المنتج
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="مثال: iPhone 16 Pro"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  التصنيف
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    handleCategoryChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >

                  <option value="">
                    اختر التصنيف
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={createCategoryValue(
                        category.name
                      )}
                    >
                      {category.name}
                    </option>
                  ))}

                </select>

                {categories.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    أضف تصنيفًا أولاً.
                  </p>
                )}

              </div>

            </div>

            {/* ================================================= */}
            {/* الأسعار والمخزون */}
            {/* ================================================= */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  السعر
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    updateForm(
                      "price",
                      event.target.value
                    )
                  }
                  placeholder="125000"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  السعر القديم
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.oldPrice}
                  onChange={(event) =>
                    updateForm(
                      "oldPrice",
                      event.target.value
                    )
                  }
                  placeholder="139000"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  المخزون
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    updateForm(
                      "stock",
                      event.target.value
                    )
                  }
                  placeholder="10"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

            </div>

            {/* ================================================= */}
            {/* التقييم والمراجعات والشارة */}
            {/* ================================================= */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  التقييم
                </label>

                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) =>
                    updateForm(
                      "rating",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  عدد المراجعات
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.reviews}
                  onChange={(event) =>
                    updateForm(
                      "reviews",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-slate-700">
                  الشارة
                </label>

                <input
                  type="text"
                  value={form.badge}
                  onChange={(event) =>
                    updateForm(
                      "badge",
                      event.target.value
                    )
                  }
                  placeholder="الأكثر مبيعًا"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

            </div>

            {/* ================================================= */}
            {/* الوصف */}
            {/* ================================================= */}

            <div>

              <label className="mb-2 block font-medium text-slate-700">
                وصف المنتج
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                placeholder="اكتب وصف المنتج هنا..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>

            {/* ================================================= */}
            {/* المميزات */}
            {/* ================================================= */}

            <div>

              <label className="mb-2 block font-medium text-slate-700">
                مميزات المنتج
              </label>

              <textarea
                value={form.features}
                onChange={(event) =>
                  updateForm(
                    "features",
                    event.target.value
                  )
                }
                rows={5}
                placeholder={`كل ميزة في سطر منفصل
شاشة عالية الجودة
بطارية قوية
ضمان سنة`}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <p className="mt-2 text-sm text-slate-500">
                اكتب كل ميزة في سطر منفصل.
              </p>

            </div>

            {/* ================================================= */}
            {/* الصور المتعددة */}
            {/* ================================================= */}

            <div>

              <label className="mb-2 block font-medium text-slate-700">
                صور المنتج
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="block w-full rounded-xl border border-slate-300 bg-white p-3"
              />

              <p className="mt-2 text-sm text-slate-500">
                يمكنك اختيار عدة صور دفعة واحدة.
                الحد الأقصى لحجم كل صورة 5 ميغابايت.
              </p>

              {/* ================================================= */}
              {/* الصور الموجودة */}
              {/* ================================================= */}

              {existingImages.length > 0 && (
                <div className="mt-6">

                  <p className="mb-3 text-sm font-bold text-slate-700">
                    الصور الحالية
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

                    {existingImages.map(
                      (url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                        >

                          <div className="flex h-36 items-center justify-center">
                            <img
                              src={url}
                              alt={`صورة المنتج ${index + 1}`}
                              className="h-full w-full object-contain"
                            />
                          </div>

                          {/* الرئيسية */}

                          {index === 0 && (
                            <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                              الرئيسية
                            </span>
                          )}

                          {/* زر جعلها رئيسية */}

                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                makeExistingImageMain(
                                  index
                                )
                              }
                              className="absolute bottom-2 right-2 rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white hover:bg-blue-700"
                            >
                              رئيسية
                            </button>
                          )}

                          {/* حذف */}

                          <button
                            type="button"
                            onClick={() =>
                              removeExistingImage(
                                index
                              )
                            }
                            className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white hover:bg-red-700"
                            title="حذف الصورة"
                          >
                            ×
                          </button>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* ================================================= */}
              {/* الصور الجديدة */}
              {/* ================================================= */}

              {imagePreviews.length > 0 && (
                <div className="mt-6">

                  <p className="mb-3 text-sm font-bold text-slate-700">
                    الصور الجديدة
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

                    {imagePreviews.map(
                      (url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative overflow-hidden rounded-2xl border border-green-200 bg-slate-50"
                        >

                          <div className="flex h-36 items-center justify-center">
                            <img
                              src={url}
                              alt={`الصورة الجديدة ${index + 1}`}
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-1 text-xs font-bold text-white">
                            جديدة
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeNewImage(index)
                            }
                            className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white hover:bg-red-700"
                            title="إزالة الصورة"
                          >
                            ×
                          </button>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* لا توجد صور */}

              {existingImages.length === 0 &&
                imagePreviews.length === 0 && (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    لم يتم اختيار أي صورة.
                  </div>
                )}

            </div>

            {/* ================================================= */}
            {/* أزرار الحفظ */}
            {/* ================================================= */}

            <div className="flex flex-wrap gap-3">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "جاري الحفظ..."
                  : editing
                    ? "حفظ التعديلات"
                    : "إضافة المنتج"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-slate-300 px-8 py-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
              )}

            </div>

          </form>

        </section>

        {/* ================================================= */}
        {/* قائمة المنتجات */}
        {/* ================================================= */}

        <section className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-xl font-bold text-slate-900">
              المنتجات الموجودة
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              جميع المنتجات المحفوظة في قاعدة البيانات.
            </p>

          </div>

          {/* تحميل */}

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              جاري تحميل المنتجات...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-12 text-center text-slate-500">
              لا توجد منتجات حاليًا.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {products.map((product) => {

                /*
                 * دعم المنتجات القديمة التي لا تحتوي
                 * على images
                 */
                const productImages =
                  Array.isArray(product.images) &&
                  product.images.length > 0
                    ? product.images
                    : product.image
                      ? [product.image]
                      : [];

                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >

                    {/* ================================================= */}
                    {/* الصورة الرئيسية */}
                    {/* ================================================= */}

                    <div className="relative flex h-56 items-center justify-center bg-slate-50">

                      {productImages.length > 0 ? (
                        <img
                          src={productImages[0]}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-400">
                          لا توجد صورة
                        </span>
                      )}

                      {/* عدد الصور */}

                      {productImages.length > 1 && (
                        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                          {productImages.length} صور
                        </span>
                      )}

                    </div>

                    {/* ================================================= */}
                    {/* صور مصغرة */}
                    {/* ================================================= */}

                    {productImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white p-3">

                        {productImages
                          .slice(0, 5)
                          .map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <img
                                src={image}
                                alt={`${product.name} ${index + 1}`}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ))}

                        {productImages.length > 5 && (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            +{productImages.length - 5}
                          </div>
                        )}

                      </div>
                    )}

                    {/* ================================================= */}
                    {/* المعلومات */}
                    {/* ================================================= */}

                    <div className="p-5">

                      {product.badge && (
                        <span className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {product.badge}
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-slate-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {product.categoryName}
                      </p>

                      {/* السعر */}

                      <div className="mt-4 flex items-center justify-between">

                        <div>

                          <span className="text-xl font-bold text-blue-600">
                            {Number(
                              product.price
                            ).toLocaleString(
                              "ar-DZ"
                            )}
                          </span>

                          <span className="mr-1 text-sm text-slate-500">
                            دج
                          </span>

                        </div>

                        {product.oldPrice && (
                          <span className="text-sm text-slate-400 line-through">
                            {Number(
                              product.oldPrice
                            ).toLocaleString(
                              "ar-DZ"
                            )}{" "}
                            دج
                          </span>
                        )}

                      </div>

                      {/* المخزون */}

                      <div className="mt-3 flex items-center justify-between text-sm">

                        <span className="text-slate-600">
                          المخزون:
                        </span>

                        <span
                          className={
                            Number(product.stock) <=
                            0
                              ? "font-bold text-red-600"
                              : Number(product.stock) <=
                                  5
                                ? "font-bold text-orange-600"
                                : "font-bold text-green-600"
                          }
                        >
                          {product.stock}
                        </span>

                      </div>

                      {/* عدد الصور */}

                      <div className="mt-2 flex items-center justify-between text-sm">

                        <span className="text-slate-600">
                          عدد الصور:
                        </span>

                        <span className="font-bold text-slate-700">
                          {productImages.length}
                        </span>

                      </div>

                      {/* ================================================= */}
                      {/* أزرار */}
                      {/* ================================================= */}

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            handleEditProduct(
                              product
                            )
                          }
                          className="rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700 hover:bg-blue-100"
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteProduct(
                              product
                            )
                          }
                          className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600 hover:bg-red-100"
                        >
                          حذف
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}