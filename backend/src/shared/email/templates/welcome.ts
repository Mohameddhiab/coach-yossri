import { ctaButton, esc, infoBox, renderEmailLayout } from './layout';

export function renderWelcomeEmail(
  prenom: string,
  email: string,
  tempPassword: string,
  appUrl: string,
): string {
  return renderEmailLayout({
    title: 'مرحباً بك في كوتش يسري 💪',
    preheader: 'تم إنشاء حسابك بنجاح — اكتشف تفاصيل تسجيل الدخول',
    bodyHtml: `
      <p style="margin:0;">مرحباً <b style="color:#FBBF24;">${esc(prenom)}</b>،</p>
      <p style="margin:14px 0 0;">
        تم إنشاء حسابك بنجاح في <b>منصة كوتش يسري</b>. ستجد أدناه بيانات الدخول
        المؤقتة الخاصة بك، وننصحك بتغيير كلمة المرور بعد أول تسجيل دخول من صفحة
        الإعدادات داخل التطبيق.
      </p>`,
    noteHtml:
      infoBox(`
        <span style="font-size:12px;color:#9BA0A8;display:block;margin-bottom:6px;">بيانات تسجيل الدخول</span>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:12px;color:#9BA0A8;padding:2px 0;width:45%;">البريد الإلكتروني</td>
            <td dir="ltr" style="font-size:13px;color:#ECEDEF;text-align:left;font-weight:700;word-break:break-all;">${esc(email)}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#9BA0A8;padding:6px 0 0;width:45%;">كلمة المرور المؤقتة</td>
            <td dir="ltr" style="font-size:13px;color:#FBBF24;text-align:left;font-weight:800;letter-spacing:.5px;background:#1A1B1F;border:1px dashed #F59E0B;border-radius:6px;padding:4px 8px;display:inline-block;">${esc(tempPassword)}</td>
          </tr>
        </table>`) + ctaButton(appUrl, 'الدخول إلى حسابي'),
  });
}
