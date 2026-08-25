export const DAILY_MOTIVATION: string[] = [
  "النتيجة ما تجيش بالصدفة — تجي بالعزيمة والاستمرار 💪",
  "حصة اليوم هي الهدية لي تقدّمها لنسخك الجاي",
  "المشوار الطويل يبدا بخطوة — وأنت تسنع خطوتك اليوم",
  "ما تخافش من التعب، خاف من الندم باش توقف",
  "الانضباط هو الفرق بين الهدف والنتيجة",
  "كل كيلو ينقص = قصة نجاح جديدة تكتبها",
  "التكرار يعلّم الشاطر — والتكرار يبني الجسد",
  "ابدأ صغير، ابقى ثابت، توصل بعيد",
  "اللي يوقف اليوم، يخسر المباراة كاملة",
  "جسمك يسمع كلامك — خليك إيجابي معاه",
];

export function motivationOfToday(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return DAILY_MOTIVATION[dayOfYear % DAILY_MOTIVATION.length];
}