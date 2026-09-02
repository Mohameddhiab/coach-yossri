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
  price: number;
  features: string[];
  seats?: {
    total: number;
    remaining: number;
  };
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
    id: "online",
    name: "أونلاين",
    tagline: "خطة غذائية + تمارين",
    places: "متاحة",
    delivery: "التجهيز خلال 48 ساعة",
    highlight: false,
    price: 60,
    features: [
      "خطة غذائية محسوبة بالماكروز",
      "جدول تمارين بالصور (charge/reps/tempo)",
      "تتبع الوزن والصور والتصدير PDF",
      "خطة غذائية محسوبة السعرات والماكروز",
      "جدول تمارين بالصور (توضيح الجولات والتكرارات والراحة)",
      "تتبع الوزن والقياسات وتصدير النتائج بصيغة PDF",
      "أهداف شهرية وتحديات مستمرة",
      "الوصول الكامل إلى التطبيق",
    ],
  },
  {
    id: "premium-coach",
    name: "بريميوم كوتش",
    tagline: "متابعة شخصية كاملة",
    places: "متاحة حالياً",
    delivery: "التجهيز خلال 24 ساعة",
    highlight: true,
    price: 150,
    seats: { total: 15, remaining: 4 },
    features: [
      "جميع ميزات باقة أونلاين",
      "تدريب مباشر مع المدرب",
      "محادثة مباشرة مع المدرب",
      "متابعة شخصية يومية",
      "تعديلات أسبوعية بناءً على استجابة جسمك",
      "أولوية قصوى في جميع الخدمات",
    ],
  },
];

export const LANDING_FAQ: LandingFaq[] = [
  {
    q: "كم عدد الحصص التدريبية في الأسبوع؟ وكم مدة كل حصة؟",
    a: "يتراوح عدد الحصص بين 3 و5 أسبوعياً بحسب مستواك وهدفك، وتتراوح مدة كل حصة بين 60 و90 دقيقة، موزّعة لاستهداف جميع العضلات مع أيام راحة مدروسة.",
  },
  {
    q: "هل الخطة الغذائية مناسبة لحالتي الصحية وتفضيلاتي؟",
    a: "نعم، تُبنى الخطة بناءً على وزنك وهدفك وحالتك الصحية وتفضيلاتك الغذائية، مع بدائل مرنة تناسب ميزانيتك — دون حرمان.",
  },
  {
    q: "هل أحتاج إلى مكمّلات غذائية؟",
    a: "ليست إلزامية. يتم تحديد خطة المكمّلات والفيتامينات فقط عند الحاجة، بناءً على تحاليلك وهدفك، وتكون مشمولة في باقة بريميوم كوتش.",
  },
  {
    q: "لديّ إصابة سابقة — هل يمكنني التدريب؟",
    a: "نعم، نراعي الإصابات السابقة والحالية عند تصميم جدول التمارين، ونُكيّف الأحمال التدريبية والأجهزة لتتدرب بأمان.",
  },
  {
    q: "كيف تتم متابعة تقدمي وتعديل البرنامج؟",
    a: "عبر التطبيق: تسجيل وزن وصور أسبوعياً، هدف شهري، وتحديات. يراجع المدرب استجابة جسمك ويعدّل الخطة كل أسبوع.",
  },
  {
    q: "ما الفرق بين باقة أونلاين وباقة بريميوم كوتش؟",
    a: "أونلاين: خطة غذائية وتمارين مخصصة لك مع تتبع التقدم وتحديات الشهر. بريميوم كوتش: يضيف متابعة شخصية يومية ومحادثة مباشرة مع المدرب وتعديلات أسبوعية بحسب استجابة جسمك.",
  },
  {
    q: "هل يمكنني التدريب في المنزل أم يجب الحضور إلى الصالة الرياضية؟",
    a: "البرنامج مصمّم للصالة الرياضية بحسب الأجهزة المتاحة، ويمكن تكييفه للمنزل عند الحاجة. باقة أونلاين وبريميوم كوتش تشملان كل ما تحتاجه للتدريب أيًّا كان المكان.",
  },
];

export const COACH_INFO = {
  name: "Coach Yosri",
  title: "مدرب شخصي معتمد — IFBB",
  tagline: "مع مدربك بكل صحة وقوة 💪",
  description:
    "مدرب شخصي معتمد مختص في تحويل الجسم والتغذية — نتابع معك وزنك وغذاءك وبرنامجك يوماً بيوم، حتى تصل إلى هدفك.",
  photo: "/coach.jpeg",
  photoAlt: "Coach Yosri في القاعة",
  about:
    "منذ عام 2018 وأنا أرافق الرياضيين من جميع المستويات — مبتدئين ومتقدّمين. أسلوبي: تدريب جادّ بمعناه الإيجابي، متابعة يومية للوزن والتغذية، وبرامج مبنية على جسمك أنت وليست على نموذج جاهز. الهدف واحد: نتيجة تظهر وتدوم.",
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
    phone: "+216 21 636 922",
    whatsapp: "+21621636922",
    address: "الشارع الرئيسي — وسط المدينة",
    hours: "الاثنين — السبت: 9:00 — 22:00",
    instagram: "https://www.instagram.com/stories/coach_yosri/",
    facebook: "https://www.facebook.com/Yosri.messadi1?locale=fr_FR",
  },
} as const;