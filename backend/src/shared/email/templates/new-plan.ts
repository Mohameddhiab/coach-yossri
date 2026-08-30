import { ctaButton, esc, renderEmailLayout } from './layout';

export function renderNewPlanEmail(titre: string, appUrl: string): string {
  return renderEmailLayout({
    eyebrow: 'خطة جديدة',
    title: 'خطتك الجديدة جاهزة 🍽️',
    preheader: `أصبحت خطتك "${titre}" جاهزة — افتح التطبيق لاستكشافها الآن`,
    bodyHtml: `
      <p style="margin:0;">مرحباً،</p>
      <p style="margin:14px 0 0;">
        قام مدربك بإعداد خطة جديدة مخصصة لك:
      </p>
      <p style="margin:14px 0 0;text-align:center;">
        <span style="display:inline-block;padding:8px 18px;background:rgba(251,191,36,.08);
          border:1px solid rgba(251,191,36,.35);border-radius:10px;
          font-weight:800;color:#FBBF24;font-size:15px;">
          ${esc(titre)}
        </span>
      </p>
      <p style="margin:16px 0 0;">
        افتح التطبيق الآن للاطلاع على تفاصيل التدريبات والوجبات، وابدأ في دمجها
        ضمن روتينك اليومي.
      </p>`,
    noteHtml: ctaButton(appUrl, 'فتح خطتي'),
  });
}
