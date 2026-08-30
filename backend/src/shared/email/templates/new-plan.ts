import { ctaButton, esc, renderEmailLayout } from './layout';

export function renderNewPlanEmail(titre: string, appUrl: string): string {
  return renderEmailLayout({
    title: 'خطة جديدة جاهزة لك 🍽️',
    preheader: 'أصبحت خطتك التدريبية والغذائية جاهزة — افتح التطبيق لاستكشافها',
    bodyHtml: `
      <p style="margin:0;">مرحباً،</p>
      <p style="margin:14px 0 0;">
        قام مدربك بإعداد خطة جديدة لك: <b style="color:#FBBF24;">${esc(titre)}</b>.
        افتح التطبيق الآن لمتابعة تفاصيل خطتك وإضافة التدريبات والوجبات إلى روتينك اليومي.
      </p>`,
    noteHtml: ctaButton(appUrl, 'فتح خطتي'),
  });
}
