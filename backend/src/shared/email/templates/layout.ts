export const BRAND = {
  name: 'كوتش يسري',
  tagline: 'منصة التدريب الرياضي الاحترافية',
  accent: '#F59E0B',
  accentDark: '#1A1202',
  bg: '#0B0C0F',
  card: '#1C1D21',
  border: '#2A2D33',
  text: '#ECEDEF',
  muted: '#9BA0A8',
  subtle: '#6B7078',
  logoUrl: 'https://coach-yossri.vercel.app/icons/logo-1024.png',
} as const;

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function ctaButton(href: string, label: string): string {
  return `
  <tr><td align="center" style="padding:8px 0 4px;">
    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href)}" style="height:48px;v-text-anchor:middle;" arcsize="12%" stroke="f" fillcolor="#F59E0B"><w:anchorlock/><center style="color:#1A1202;font-family:Tahoma,Arial,sans-serif;font-weight:bold;font-size:15px;">${esc(label)}</center></v:roundrect><![endif]-->
    <a href="${esc(href)}" target="_blank" class="btn" style="display:inline-block;background-color:#F59E0B;color:#1A1202;font-size:15px;font-weight:800;text-decoration:none;padding:14px 44px;border-radius:12px;box-shadow:0 4px 14px rgba(245,158,11,.28);">
      ${esc(label)}
    </a>
  </td></tr>`;
}

export function infoBox(html: string): string {
  return `
  <tr><td style="padding:0 32px 4px;">
    <div style="background:#232429;border:1px solid #2A2D33;border-radius:12px;padding:14px 16px;">
      ${html}
    </div>
  </td></tr>`;
}

export interface EmailLayoutOptions {
  title: string;
  preheader: string;
  bodyHtml: string;
  noteHtml?: string;
}

export function renderEmailLayout({
  title,
  preheader,
  bodyHtml,
  noteHtml,
}: EmailLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>${esc(title)}</title>
<style>
  @media only screen and (max-width:600px){
    .card{width:100% !important;border-radius:0 !important;}
    .pad{padding-left:20px !important;padding-right:20px !important;}
    .btn{width:100% !important;box-sizing:border-box !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#0B0C0F;font-family:'Segoe UI',Tahoma,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0B0C0F;">
    ${esc(preheader)}‌&nbsp;&zwnj;&nbsp;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0C0F;padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" class="card" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#1C1D21;border-radius:18px;border:1px solid #2A2D33;overflow:hidden;">

        <!-- Header / marque -->
        <tr><td align="center" style="padding:30px 32px 6px;">
          <img
            src="${BRAND.logoUrl}"
            alt="${esc(BRAND.name)}"
            width="64"
            height="64"
            style="display:block;width:64px;height:64px;border-radius:16px;border:1px solid #2A2D33;box-shadow:0 6px 18px rgba(0,0,0,.35);"
          />
          <div style="font-size:21px;font-weight:900;color:#ECEDEF;margin-top:12px;">${BRAND.name}</div>
          <div style="font-size:12px;color:#9BA0A8;margin-top:4px;letter-spacing:.2px;">${BRAND.tagline}</div>
        </td></tr>

        <!-- Titre -->
        <tr><td class="pad" style="padding:22px 32px 4px;">
          <h1 style="margin:0;font-size:21px;line-height:1.5;color:#ECEDEF;">${esc(title)}</h1>
        </td></tr>

        <!-- Corps -->
        <tr><td class="pad" style="padding:10px 32px 8px;font-size:14px;line-height:2;color:#C9CCD2;">
          ${bodyHtml}
        </td></tr>

        <!-- Note (optionnel) -->
        ${noteHtml ?? ''}

        <!-- Sécurité -->
        <tr><td class="pad" style="padding:18px 32px 22px;">
          <div style="border-top:1px solid #2A2D33;padding-top:16px;">
            <p style="margin:0;font-size:12px;line-height:1.9;color:#9BA0A8;">
              إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان — لم يتم إجراء أي تعديل على حسابك.
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#6B7078;">
              هذه رسالة تلقائية من منصة ${BRAND.name} — لا ترد على هذا البريد.
            </p>
          </div>
        </td></tr>
      </table>

      <!-- Pied de page -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:20px auto 0;">
        <tr><td align="center" style="padding:0 16px;">
          <p style="margin:0;font-size:11px;line-height:1.8;color:#6B7078;">
            © 2026 ${BRAND.name} — ${BRAND.tagline}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
