import { ctaButton, esc, infoBox, renderEmailLayout } from './layout';

export function renderWelcomeEmail(
  prenom: string,
  email: string,
  tempPassword: string,
  appUrl: string,
): string {
  return renderEmailLayout({
    eyebrow: 'أهلاً بك',
    title: 'مرحباً بك في كوتش يسري 💪',
    preheader:
      'تم إنشاء حسابك بنجاح — اكتشف تفاصيل تسجيل الدخول والخطوات التالية',
    bodyHtml: `
      <p style="margin:0;">مرحباً <b style="color:#FBBF24;">${esc(prenom)}</b>،</p>
      <p style="margin:14px 0 0;">
        تم إنشاء حسابك بنجاح في <b>منصة كوتش يسري</b>. ستجد أدناه بيانات الدخول
        المؤقتة الخاصة بك.
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
            <td dir="ltr" style="font-size:13px;color:#FBBF24;text-align:left;font-weight:800;
              letter-spacing:.5px;background:#16171B;border:1px dashed #F59E0B;border-radius:6px;
              padding:4px 8px;display:inline-block;">${esc(tempPassword)}</td>
          </tr>
        </table>`) +
      ctaButton(appUrl, 'الدخول إلى حسابي') +
      `
      <tr><td class="pad" style="padding:26px 32px 0;">
        <span style="font-family:'Tajawal','Segoe UI',Tahoma,Arial,sans-serif;font-size:12px;
          font-weight:700;color:#9BA0A8;letter-spacing:.3px;">الخطوات التالية</span>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
          <tr>
            <td width="28" valign="top" style="padding:5px 0;">
              <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;
                background:#1D1E23;border:1px solid #2A2D33;border-radius:6px;color:#FBBF24;
                font-size:11px;font-weight:800;">1</span>
            </td>
            <td valign="top" style="padding:5px 0;font-size:13px;color:#C7C9CE;line-height:1.7;">سجّل دخولك بالبيانات أعلاه</td>
          </tr>
          <tr>
            <td width="28" valign="top" style="padding:5px 0;">
              <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;
                background:#1D1E23;border:1px solid #2A2D33;border-radius:6px;color:#FBBF24;
                font-size:11px;font-weight:800;">2</span>
            </td>
            <td valign="top" style="padding:5px 0;font-size:13px;color:#C7C9CE;line-height:1.7;">غيّر كلمة المرور من صفحة الإعدادات</td>
          </tr>
          <tr>
            <td width="28" valign="top" style="padding:5px 0;">
              <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;
                background:#1D1E23;border:1px solid #2A2D33;border-radius:6px;color:#FBBF24;
                font-size:11px;font-weight:800;">3</span>
            </td>
            <td valign="top" style="padding:5px 0;font-size:13px;color:#C7C9CE;line-height:1.7;">استكشف خطتك وابدأ رحلتك التدريبية</td>
          </tr>
        </table>
      </td></tr>`,
  });
}
