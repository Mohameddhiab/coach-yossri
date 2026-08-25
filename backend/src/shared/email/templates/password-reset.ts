export function renderPasswordResetEmail(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>تغيير كلمة المرور</title></head>
<body style="margin:0;padding:0;background-color:#141518;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141518;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#1c1d21;border-radius:16px;border:1px solid #2a2c33;overflow:hidden;">
        <tr><td style="padding:28px 32px 0;text-align:center;">
          <div style="font-size:26px;font-weight:900;color:#f59e0b;">قاوي 💪</div>
          <div style="font-size:12px;color:#9ba0a8;margin-top:4px;">صحّة وقوّة مع كوتشك</div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <h1 style="margin:0;font-size:20px;color:#ededf0;">تغيير كلمة المرور</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 16px;">
          <p style="margin:0;font-size:14px;line-height:1.8;color:#c9ccd2;">
            مرحباً <b style="color:#fbbf24;">${name}</b>،
            تلقينا طلباً لتغيير كلمة المرور الخاصة بك.
          </p>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.8;color:#c9ccd2;">
            اضغط على هذا الرابط لتعيين كلمة مرور جديدة — صالح لمدة ساعة واحدة فقط.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 20px;">
          <a href="${resetUrl}"
             style="display:inline-block;background-color:#f59e0b;color:#1a1202;font-size:15px;font-weight:800;text-decoration:none;padding:13px 40px;border-radius:10px;">
            تغيير كلمة المرور
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:12px;line-height:1.7;color:#9ba0a8;">
            إذا لم يعمل الرابط، انسخ هذا الرابط والصقه في المتصفح:
          </p>
          <p style="margin:8px 0 0;font-size:12px;direction:ltr;text-align:left;word-break:break-all;color:#6b7078;">
            ${resetUrl}
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #2a2c33;">
          <p style="margin:0;font-size:12px;line-height:1.7;color:#9ba0a8;">
            إذا لم تطلب هذا التغيير فتجاهل هذه الرسالة — لم يتم تغيير كلمة المرور الخاصة بك.
          </p>
        </td></tr>
      </table>
      <div style="max-width:480px;margin:16px auto 0;text-align:center;font-size:11px;color:#6b7078;">
        © 9AWI — Coach Yosri
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}
