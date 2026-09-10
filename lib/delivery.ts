import { supabase } from "@/lib/supabase";

export type DeliveryCompany = {
  id: string;
  name: string;
  active: boolean;
  homeEnabled: boolean;
  officeEnabled: boolean;
  prices: Record<
    string,
    {
      home: number;
      office: number;
    }
  >;
};

export const DELIVERY_STORAGE_KEY =
  "n-digital-delivery-companies";

export const DEFAULT_DELIVERY_COMPANIES: DeliveryCompany[] = [
  {
    id: "yalidine",
    name: "Yalidine",
    active: true,
    homeEnabled: true,
    officeEnabled: true,
    prices: {},
  },
  {
    id: "zr-express",
    name: "ZR Express",
    active: true,
    homeEnabled: true,
    officeEnabled: true,
    prices: {},
  },
  {
    id: "maystro",
    name: "Maystro Delivery",
    active: true,
    homeEnabled: true,
    officeEnabled: true,
    prices: {},
  },
  {
    id: "noest",
    name: "Noest",
    active: true,
    homeEnabled: true,
    officeEnabled: true,
    prices: {},
  },
];

type SupabaseDeliveryCompany = {
  id: string;
  name: string;
  active: boolean;
  home_enabled: boolean;
  office_enabled: boolean;
  prices: Record<
    string,
    {
      home: number;
      office: number;
    }
  >;
};

function fromDatabase(
  company: SupabaseDeliveryCompany
): DeliveryCompany {
  return {
    id: company.id,
    name: company.name,
    active: company.active,
    homeEnabled: company.home_enabled,
    officeEnabled: company.office_enabled,
    prices: company.prices || {},
  };
}

function toDatabase(company: DeliveryCompany) {
  return {
    id: company.id,
    name: company.name,
    active: company.active,
    home_enabled: company.homeEnabled,
    office_enabled: company.officeEnabled,
    prices: company.prices || {},
  };
}

export async function getDeliveryCompanies(): Promise<
  DeliveryCompany[]
> {
  try {
    const { data, error } = await supabase
      .from("delivery_companies")
      .select("*")
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "تعذر تحميل شركات التوصيل من Supabase:",
        error
      );

      return DEFAULT_DELIVERY_COMPANIES;
    }

    if (!data || data.length === 0) {
      return DEFAULT_DELIVERY_COMPANIES;
    }

    return data.map(fromDatabase);
  } catch (error) {
    console.error(
      "حدث خطأ أثناء تحميل شركات التوصيل:",
      error
    );

    return DEFAULT_DELIVERY_COMPANIES;
  }
}

export async function saveDeliveryCompany(
  company: DeliveryCompany
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("delivery_companies")
      .upsert(toDatabase(company), {
        onConflict: "id",
      });

    if (error) {
      console.error(
        "تعذر حفظ شركة التوصيل:",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "حدث خطأ أثناء حفظ شركة التوصيل:",
      error
    );

    return false;
  }
}

export async function saveDeliveryCompanies(
  companies: DeliveryCompany[]
): Promise<boolean> {
  try {
    const rows = companies.map(toDatabase);

    const { error } = await supabase
      .from("delivery_companies")
      .upsert(rows, {
        onConflict: "id",
      });

    if (error) {
      console.error(
        "تعذر حفظ شركات التوصيل:",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "حدث خطأ أثناء حفظ شركات التوصيل:",
      error
    );

    return false;
  }
}

export async function deleteDeliveryCompany(
  id: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("delivery_companies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "تعذر حذف شركة التوصيل:",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "حدث خطأ أثناء حذف شركة التوصيل:",
      error
    );

    return false;
  }
}

export function getDeliveryPrice(
  company: DeliveryCompany,
  wilaya: string,
  municipality: string,
  type: "home" | "office"
): number {
  const exactKey =
    `${wilaya}|||${municipality}`;

  const wilayaKey =
    `${wilaya}|||*`;

  const exactPrice =
    company.prices?.[exactKey];

  if (exactPrice) {
    return Number(exactPrice[type]) || 0;
  }

  const wilayaPrice =
    company.prices?.[wilayaKey];

  if (wilayaPrice) {
    return Number(wilayaPrice[type]) || 0;
  }

  return 0;
}