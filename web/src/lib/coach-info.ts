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
      "هدف شهري وتحديات",
      "تطبيق العضو الكامل",
    ],
  },
  {
    id: "premium-coach",
    name: "بريميوم كوش",
    tagline: "متابعة شخصية كاملة",
    places: "متاحة حالياً — 5 أماكن",
    delivery: "التجهيز خلال 24 ساعة",
    highlight: true,
    price: 150,
    features: [
      "كل مميزات أونلاين",
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
    a: "ليست إلزامية. نحدد خطة مكملات وفيتامينات فقط إذا دعت الحاجة، حسب تحاليلك وهدفك، وتكون مشمولة في باقة بريميوم كوش.",
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
    q: "ما الفرق بين باقتي أونلاين وبريميوم كوش؟",
    a: "أونلاين: خطة غذائية وتمارين مخصصة لك مع تتبع التقدم وتحديات الشهر. بريميوم كوش: يضيف متابعة شخصية يومية ومحادثة مباشرة مع المدرب وتعديلات أسبوعية حسب استجابة جسمك.",
  },
  {
    q: "هل يمكنني التدريب في المنزل أم يجب الحضور للقاعة؟",
    a: "البرنامج مصمم للقاعة حسب أجهزتها، ويمكن تكييفه للمنزل عند الحاجة. باقتا أونلاين وبريميوم كوش تشملان كل ما تحتاجه للتدريب بغض النظر عن المكان.",
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
    instagram: "https://www.instagram.com/coach.yosri",
    facebook: "https://www.facebook.com/coach.yosri",
  },
} as const;