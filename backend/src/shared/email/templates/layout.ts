/**
 * layout.ts — Design system commun à tous les emails "كوتش يسري"
 * -----------------------------------------------------------------
 * Objectifs de cette version :
 *  - Rendu correct sur Outlook (VML), Gmail, Apple Mail, mobile (RTL inclus)
 *  - Identité "industrial/sport" cohérente : fond sombre, accent or (#FBBF24),
 *    bande signature en haut de la carte, badge de marque
 *  - Hiérarchie claire : eyebrow → titre → corps → bloc info/CTA → footer
 *  - Dark mode natif géré (meta color-scheme)
 */

const FONT_STACK = "'Tajawal','Segoe UI',Tahoma,Geneva,Arial,sans-serif";

const COLORS = {
  bgPage: '#0A0B0D',
  bgCard: '#16171B',
  border: '#232429',
  surface: '#1D1E23',
  surfaceBorder: '#2A2D33',
  accent: '#FBBF24',
  accentDark: '#F59E0B',
  textPrimary: '#ECEDEF',
  textBody: '#C7C9CE',
  textSecondary: '#9BA0A8',
  textMuted: '#6B7078',
  textFaint: '#4B4F57',
};

/** Échappe une chaîne pour une insertion HTML sûre. */
export function esc(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Bouton d'action principal — pattern "bulletproof button" :
 * dégradé + coins arrondis pour les clients modernes, secours VML pour Outlook.
 */
export function ctaButton(url: string, label: string): string {
  const safeUrl = esc(url);
  const safeLabel = esc(label);
  return `
  <tr>
    <td align="center" style="padding:30px 32px 6px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${safeUrl}" style="height:52px;v-text-anchor:middle;width:270px;" arcsize="14%"
        fillcolor="${COLORS.accent}" stroke="f">
        <center style="color:#14150F;font-family:Tahoma,sans-serif;font-size:15px;font-weight:700;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeUrl}" target="_blank"
        style="display:inline-block;background:linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark});
        color:#14150F;font-family:${FONT_STACK};font-size:15px;font-weight:800;text-decoration:none;
        padding:16px 42px;border-radius:10px;letter-spacing:.2px;
        box-shadow:0 8px 20px rgba(251,191,36,.25);">
        ${safeLabel}
      </a>
      <!--<![endif]-->
    </td>
  </tr>`;
}

/** Bloc "carte dans la carte" pour mettre en avant une information clé (identifiants, délai, alerte...). */
export function infoBox(innerHtml: string): string {
  return `
  <tr>
    <td class="pad" style="padding:22px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${COLORS.surface};border:1px solid ${COLORS.surfaceBorder};border-radius:12px;">
        <tr><td style="padding:18px 20px;">
          ${innerHtml}
        </td></tr>
      </table>
    </td>
  </tr>`;
}

interface EmailLayoutOptions {
  /** Petit label au-dessus du titre (ex: "الأمان", "خطة جديدة"). Optionnel. */
  eyebrow?: string;
  title: string;
  preheader: string;
  bodyHtml: string;
  noteHtml?: string;
}

export function renderEmailLayout({
  eyebrow,
  title,
  preheader,
  bodyHtml,
  noteHtml = '',
}: EmailLayoutOptions): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${esc(title)}</title>
<!--[if mso]>
<noscript><xml>
<o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0;padding:0;width:100%!important;background:${COLORS.bgPage};}
  a{color:${COLORS.accent};}
  @media only screen and (max-width:600px){
    .container{width:100%!important;}
    .pad{padding-left:20px!important;padding-right:20px!important;}
    h1{font-size:20px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.bgPage};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <center style="width:100%;background:${COLORS.bgPage};">
    <!--[if mso]>
    <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td>
    <![endif]-->
    <table role="presentation" class="container" width="100%" cellpadding="0" cellspacing="0"
      style="max-width:600px;margin:0 auto;">

      <!-- Badge de marque -->
      <tr>
        <td align="center" style="padding:36px 20px 20px;">
          <span style="display:inline-flex;align-items:center;gap:10px;padding:7px 18px 7px 10px;
            border:1px solid rgba(251,191,36,.35);border-radius:999px;background:rgba(251,191,36,.08);
            font-family:${FONT_STACK};font-size:13px;font-weight:700;color:${COLORS.accent};letter-spacing:.2px;">
            <img src="https://coach-yossri.vercel.app/icons/logo-1024.png" alt="Coach Yosri" width="26" height="26"
              style="display:inline-block;width:26px;height:26px;border-radius:8px;vertical-align:middle;border:0;" />
            🏋️‍♂️ كوتش يسري
          </span>
        </td>
      </tr>

      <!-- Carte -->
      <tr>
        <td class="pad" style="padding:0 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;">

            <!-- Bande signature -->
            <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${COLORS.accent};">&nbsp;</td></tr>

            <tr>
              <td class="pad" style="padding:38px 32px 0;text-align:center;">
                ${
                  eyebrow
                    ? `<span style="font-family:${FONT_STACK};font-size:12px;font-weight:700;
                        color:${COLORS.accent};letter-spacing:.4px;">${esc(eyebrow)}</span>
                       <div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>`
                    : ''
                }
                <h1 style="margin:0;font-family:${FONT_STACK};font-size:22px;line-height:1.45;
                  font-weight:800;color:${COLORS.textPrimary};">${esc(title)}</h1>
              </td>
            </tr>

            <tr>
              <td class="pad" style="padding:18px 32px 0;font-family:${FONT_STACK};font-size:15px;
                line-height:1.95;color:${COLORS.textBody};text-align:right;">
                ${bodyHtml}
              </td>
            </tr>

            ${noteHtml}

            <tr><td class="pad" style="padding:34px 32px 0;">
              <div style="height:1px;line-height:1px;font-size:0;background:${COLORS.border};">&nbsp;</div>
            </td></tr>

            <tr>
              <td class="pad" style="padding:20px 32px 30px;text-align:center;font-family:${FONT_STACK};
                font-size:12px;line-height:1.85;color:${COLORS.textMuted};">
                هذه رسالة تلقائية من منصة <b style="color:${COLORS.textSecondary};">كوتش يسري</b> — يرجى عدم الرد عليها مباشرة.<br>
                لأي استفسار، تواصل معنا مباشرة عبر التطبيق.
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer global -->
      <tr>
        <td align="center" style="padding:22px 20px 40px;font-family:${FONT_STACK};font-size:12px;color:${COLORS.textFaint};">
          © ${year} كوتش يسري — جميع الحقوق محفوظة
        </td>
      </tr>
    </table>
    <!--[if mso]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`;
}
