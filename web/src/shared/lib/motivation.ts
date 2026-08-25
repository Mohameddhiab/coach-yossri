export const DAILY_MOTIVATION: string[] = [
  "النتيجة لا تأتي صدفة — تأتي بالعزيمة والاستمرار 💪",
  "حصة اليوم هي الهدية التي تقدمها لنسختك القادمة",
  "المشوار الطويل يبدأ بخطوة — وأنت تصنع خطوتك اليوم",
  "لا تخف من التعب، خف من الندم إن توقفت",
  "الانضباط هو الفرق بين الهدف والنتيجة",
  "كل كيلو تفقده = قصة نجاح جديدة تكتبها",
  "التكرار يعلم الماهر — والتكرار يبني الجسد",
  "ابدأ صغيرًا، اثبت، وستصل بعيدًا",
  "من يتوقف اليوم، يخسر المباراة كاملة",
  "جسمك يسمع كلامك — كن إيجابيًا معه",
];

export function motivationOfToday(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return DAILY_MOTIVATION[dayOfYear % DAILY_MOTIVATION.length];
}