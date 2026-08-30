import { ctaButton, esc, infoBox, renderEmailLayout } from './layout';

export function renderPasswordResetEmail(
  name: string,
  resetUrl: string,
): string {
  return renderEmailLayout({
    eyebrow: 'الأمان',
    title: 'إعادة تعيين كلمة المرور 🔒',
    preheader: 'اضغط على الزر لتعيين كلمة مرور جديدة لحسابك في كوتش يسري',
    bodyHtml: `
      <p style="margin:0;">مرحباً <b style="color:#FBBF24;">${esc(name)}</b>،</p>
      <p style="margin:14px 0 0;">
        تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في <b>منصة كوتش يسري</b>.
        اضغط على الزر أدناه لتعيين كلمة مرور جديدة.
      </p>
      <p style="margin:14px 0 0;font-size:13px;color:#8B9098;">
        إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان — لن يتم تغيير كلمة مرورك.
      </p>`,
    noteHtml:
      infoBox(`
        <span style="font-size:12px;color:#9BA0A8;display:block;margin-bottom:2px;">⏱ صلاحية الرابط</span>
        <b style="font-size:13px;color:#FBBF24;">هذا الرابط صالح لمدة ساعة واحدة فقط.</b>
        <span style="display:block;margin-top:8px;font-size:12px;color:#9BA0A8;">
          إذا انتهت الصلاحية، اطلب رابطاً جديداً من صفحة «نسيت كلمة المرور».
        </span>`) +
      ctaButton(resetUrl, 'تعيين كلمة مرور جديدة') +
      `
      <tr><td class="pad" style="padding:14px 32px 0;">
        <p style="margin:0;font-size:12px;line-height:1.8;color:#6B7078;">
          إذا لم يعمل الزر أعلاه، انسخ الرابط التالي والصقه في المتصفح:
        </p>
        <p dir="ltr" style="margin:8px 0 0;font-size:12px;text-align:left;word-break:break-all;
          color:#8B9098;direction:ltr;background:#1D1E23;border:1px solid #2A2D33;
          border-radius:8px;padding:10px 12px;">
          ${esc(resetUrl)}
        </p>
      </td></tr>`,
  });
}
