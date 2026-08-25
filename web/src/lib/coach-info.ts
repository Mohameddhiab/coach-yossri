export interface CoachCertification {
  label: string;
  emoji: string;
}

export interface CoachExperience {
  period: string;
  gym: string;
  location?: string;
}

export interface CoachTeamMember {
  name: string;
  role: string;
  emoji: string;
}

export interface CoachStat {
  value: string;
  label: string;
}

export interface LandingPlan {
  id: string;
  name: string;
  tagline: string;
  places: string;
  delivery: string;
  highlight?: boolean;
  prices: { m3: number; m6: number; m12: number };
  features: string[];
}

export interface LandingFaq {
  q: string;
  a: string;
}

export const LANDING_STATS: CoachStat[] = [
  { value: "+860", label: "تمرين موثّق بالصور" },
  { value: "+250", label: "تحويل جسم ناجح" },
  { value: "100%", label: "برنامج مصمم خصيصاً لك" },
  { value: "1:1", label: "متابعة مباشرة" },
];

export const LANDING_PLANS: LandingPlan[] = [
  {
    id: "basic",
    name: "باسيك",
    tagline: "دخول القاعة والحضور",
    places: "متاحة",
    delivery: "التجهيز خلال 72 ساعة",
    prices: { m3: 90, m6: 160, m12: 290 },
    features: [
      "دخول القاعة",
      "تسجيل الحضور QR",
      "تصنيف وتحديات القاعة",
      "تطبيق العضو الكامل",
    ],
  },
  {
    id: "premium",
    name: "بريميوم",
    tagline: "الأكثر اختياراً",
    places: "متاحة حالياً — 5 أماكن",
    delivery: "التجهيز خلال 48 ساعة",
    highlight: true,
    prices: { m3: 140, m6: 260, m12: 480 },
    features: [
      "كل مميزات باسيك",
      "خطة غذائية محسوبة بالماكروز",
      "جدول تمارين بالصور (charge/reps/tempo)",
      "تتبع الوزن والصور والتصدير PDF",
      "هدف شهري وتحديات",
    ],
  },
  {
    id: "elite",
    name: "إيليت",
    tagline: "متابعة شخصية كاملة",
    places: "متاحة حالياً — 3 أماكن",
    delivery: "التجهيز خلال 24 ساعة",
    prices: { m3: 240, m6: 450, m12: 850 },
    features: [
      "كل مميزات بريميوم",
      "محادثة مباشرة مع المدرب",
      "متابعة شخصية يوماً بيوم",
      "تعديلات أسبوعية حسب استجابة جسمك",
      "أولوية في كل شيء",
    ],
  },
];

export const LANDING_FAQ: LandingFaq[] = [
  {
    q: "كم عدد الحصص التدريبية في الأسبوع وكم مدة كل حصة؟",
    a: "حسب مستواك وهدفك: 3 إلى 5 حصص أسبوعياً، كل حصة بين 60 و90 دقيقة، موزعة لتستهدف جميع العضلات مع أيام راحة مدروسة.",
  },
  {
    q: "هل الخطة الغذائية مناسبة لحالتي الصحية وتفضيلاتي؟",
    a: "نعم. تُبنى الخطة حسب وزنك وهدفك وحالتك الصحية وتفضيلاتك الغذائية، مع بدائل مرنة تناسب ميزانيتك — بدون حرمان.",
  },
  {
    q: "هل أحتاج إلى مكملات غذائية؟",
    a: "ليست إلزامية. نحدد خطة مكملات وفيتامينات فقط إذا دعت الحاجة، حسب تحاليلك وهدفك، وتكون مشمولة في باقتي بريميوم وإيليت.",
  },
  {
    q: "لدي إصابة سابقة — هل يمكنني التدريب؟",
    a: "نعم. نراعي الإصابات السابقة والحالية عند تصميم جدول التمارين، ونكيف الأحجام التدريبية والأجهزة المتاحة لتتدرب بأمان.",
  },
  {
    q: "كيف تتم متابعة تقدمي وتعديل البرنامج؟",
    a: "عبر التطبيق: تسجيل وزن وصور أسبوعياً، هدف شهري، وتحديات. يراجع المدرب استجابة جسمك ويعدّل الخطة كل أسبوع.",
  },
  {
    q: "ما الفرق التدريبي بين باقات باسيك وبريميوم وإيليت؟",
    a: "باسيك: دخول وحضور. بريميوم: يضيف خطة غذائية وجدول تمارين بالصور ومتابعة التقدم. إيليت: يضيف متابعة شخصية يومية ومحادثة مباشرة مع المدرب وتعديلات أسبوعية.",
  },
  {
    q: "هل يمكنني التدريب في المنزل أم يجب الحضور للقاعة؟",
    a: "البرنامج مصمم أساساً للقاعة حسب أجهزتها، ويمكن تكييفه للمنزل عند الحاجة. الحضور يبقى الأفضل للمتابعة والتجهيز السريع خلال 24 إلى 72 ساعة.",
  },
];

export const COACH_INFO = {
  name: "Coach Yosri",
  title: "مدرب شخصي معتمد — IFBB",
  tagline: "مع مدربك بكل صحة وقوة 💪",
  description:
    "مدرب شخصي معتمد مختص في تحويل الجسم والتغذية — نتابع معك وزنك وغذاءك وبرنامجك يوماً بيوم، حتى تصل إلى هدفك.",
  photo: "/yosri.png",
  photoAlt: "Coach Yosri في القاعة",
  about:
    "منذ عام 2018 وأنا أرافق الرياضيين من جميع المستويات — مبتدئين ومتقدمين. أسلوبي: تدريب جاد بمعناه الإيجابي، متابعة يومية للوزن والتغذية، وبرامج مبنية على جسمك أنت، وليست على نموذج جاهز. الهدف واحد: نتيجة تظهر وتدوم.",
  stats: [
    { value: "+8", label: "سنوات خبرة" },
    { value: "3", label: "شهادات معتمدة" },
    { value: "+250", label: "تحويل جسم ناجح" },
    { value: "4", label: "قاعات" },
  ] satisfies CoachStat[],
  certifications: [
    { label: "IFBB Certified Personal Fitness Trainer", emoji: "🏋️‍♀️" },
    { label: "Expert In Body Transformation", emoji: "💪" },
    { label: "Nutrition Assistance", emoji: "🥗" },
  ] satisfies CoachCertification[],
  experience: [
    { period: "2018 — 2019", gym: "Basic Gym", location: "Douz" },
    { period: "2020 — 2025", gym: "Amazonia Gym" },
    { period: "2026", gym: "Energy Gym" },
    { period: "2026", gym: "Fitness Gym Club" },
  ] satisfies CoachExperience[],
  team: [
    { name: "مهدي", role: "مدرب مساعد — عضلات", emoji: "🏋️" },
    { name: "أمينة", role: "استقبال وتنظيم الحصص", emoji: "💬" },
    { name: "ريم", role: "تغذية وإعداد البرامج", emoji: "🥗" },
  ] satisfies CoachTeamMember[],
  contact: {
    phone: "+216 00 000 000",
    whatsapp: "+21600000000",
    address: "الشارع الرئيسي — وسط المدينة",
    hours: "الاثنين — السبت: 9:00 — 22:00",
  },
} as const;