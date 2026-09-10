export type Product = {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  features: string[];
  rating: number;
  reviews: number;
  stock: number;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "iphone-15",
    name: "iPhone 15",
    category: "phones",
    categoryName: "هواتف",
    price: 125000,
    oldPrice: 139000,
    image: "📱",
    description:
      "هاتف iPhone 15 بتصميم أنيق وأداء قوي وكاميرا متطورة لتجربة استخدام يومية مميزة.",
    features: [
      "شاشة Super Retina",
      "كاميرا متطورة",
      "أداء قوي",
      "بطارية تدوم طوال اليوم",
    ],
    rating: 4.8,
    reviews: 126,
    stock: 10,
    badge: "الأكثر مبيعًا",
  },
  {
    id: "samsung-s24",
    name: "Samsung Galaxy S24",
    category: "phones",
    categoryName: "هواتف",
    price: 118000,
    oldPrice: 129000,
    image: "📱",
    description:
      "Galaxy S24 يجمع بين التصميم العصري والأداء القوي والشاشة عالية الجودة.",
    features: [
      "شاشة Dynamic AMOLED",
      "كاميرا احترافية",
      "معالج سريع",
      "5G",
    ],
    rating: 4.7,
    reviews: 98,
    stock: 8,
    badge: "جديد",
  },
  {
    id: "macbook-air",
    name: "MacBook Air M3",
    category: "laptops",
    categoryName: "حواسيب محمولة",
    price: 185000,
    oldPrice: 199000,
    image: "💻",
    description:
      "MacBook Air بمعالج Apple M3، خفيف وسريع ومناسب للعمل والدراسة والإبداع.",
    features: [
      "Apple M3",
      "ذاكرة 8GB",
      "SSD 256GB",
      "شاشة Retina",
    ],
    rating: 4.9,
    reviews: 74,
    stock: 6,
    badge: "مميز",
  },
  {
    id: "asus-vivobook",
    name: "ASUS Vivobook 15",
    category: "laptops",
    categoryName: "حواسيب محمولة",
    price: 99000,
    oldPrice: 109000,
    image: "💻",
    description:
      "حاسوب محمول عملي للاستخدام اليومي والدراسة والعمل مع شاشة كبيرة وتصميم أنيق.",
    features: [
      "شاشة 15.6 بوصة",
      "Intel Core i5",
      "RAM 16GB",
      "SSD 512GB",
    ],
    rating: 4.6,
    reviews: 61,
    stock: 12,
  },
  {
    id: "lg-monitor",
    name: "LG UltraGear 27",
    category: "screens",
    categoryName: "شاشات",
    price: 59000,
    oldPrice: 65000,
    image: "🖥️",
    description:
      "شاشة ألعاب بحجم 27 بوصة تقدم صورة واضحة وسلاسة عالية للألعاب والعمل.",
    features: [
      "27 بوصة",
      "دقة Full HD",
      "معدل تحديث 144Hz",
      "استجابة سريعة",
    ],
    rating: 4.7,
    reviews: 45,
    stock: 9,
    badge: "عرض",
  },
  {
    id: "airpods-pro",
    name: "AirPods Pro",
    category: "accessories",
    categoryName: "إكسسوارات",
    price: 32000,
    oldPrice: 37000,
    image: "🎧",
    description:
      "سماعات لاسلكية بصوت واضح وعزل ضوضاء وتجربة مريحة للاستخدام اليومي.",
    features: [
      "عزل الضوضاء",
      "صوت عالي الجودة",
      "اتصال لاسلكي",
      "علبة شحن",
    ],
    rating: 4.8,
    reviews: 112,
    stock: 20,
    badge: "الأكثر مبيعًا",
  },
  {
    id: "smart-watch",
    name: "Apple Watch Series 9",
    category: "accessories",
    categoryName: "إكسسوارات",
    price: 52000,
    oldPrice: 58000,
    image: "⌚",
    description:
      "ساعة ذكية أنيقة لمتابعة نشاطك اليومي والإشعارات والعديد من الوظائف الذكية.",
    features: [
      "شاشة Retina",
      "مقاومة للماء",
      "إشعارات ذكية",
      "بطارية قوية",
    ],
    rating: 4.7,
    reviews: 83,
    stock: 7,
  },
  {
    id: "gaming-keyboard",
    name: "RGB Gaming Keyboard",
    category: "accessories",
    categoryName: "إكسسوارات",
    price: 8500,
    oldPrice: 10000,
    image: "⌨️",
    description:
      "لوحة مفاتيح ألعاب بإضاءة RGB وتصميم مريح للاستخدام الطويل.",
    features: [
      "إضاءة RGB",
      "مفاتيح ميكانيكية",
      "تصميم مريح",
      "USB",
    ],
    rating: 4.5,
    reviews: 39,
    stock: 25,
    badge: "عرض",
  },
];

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}