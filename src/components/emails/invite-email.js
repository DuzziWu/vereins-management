/**
 * Generate HTML email template for invite emails
 */
export function generateInviteEmailHTML({
  fullName,
  clubName,
  role,
  inviteUrl,
  expiresIn = '7 Tagen'
}) {
  const roleLabels = {
    admin: 'Administrator',
    coach: 'Trainer',
    player: 'Spieler',
  }

  const roleLabel = roleLabels[role] || role

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einladung zu ${clubName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <div style="padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">

      <!-- Header -->
      <div style="background-color: #d9f99d; padding: 24px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a;">
          ${clubName}
        </h1>
      </div>

      <!-- Content -->
      <div style="padding: 32px; color: #e2e8f0;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #f8fafc;">
          Hallo ${fullName}!
        </h2>

        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
          Du wurdest eingeladen, dem Verein <strong style="color: #d9f99d;">${clubName}</strong> als <strong style="color: #d9f99d;">${roleLabel}</strong> beizutreten.
        </p>

        <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
          Klicke auf den Button unten, um dein Konto zu erstellen und die Einladung anzunehmen:
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background-color: #d9f99d; color: #0f172a; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
            Einladung annehmen
          </a>
        </div>

        <p style="margin: 32px 0 0 0; font-size: 14px; color: #94a3b8;">
          Diese Einladung ist ${expiresIn} gültig.
        </p>

        <!-- Link fallback -->
        <div style="margin-top: 24px; padding: 16px; background-color: #0f172a; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
            Falls der Button nicht funktioniert, kopiere diesen Link:
          </p>
          <p style="margin: 0; font-size: 12px; color: #d9f99d; word-break: break-all;">
            ${inviteUrl}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 24px 32px; border-top: 1px solid #334155; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">
          Diese E-Mail wurde automatisch gesendet.<br>
          Falls du diese Einladung nicht erwartet hast, kannst du sie ignorieren.
        </p>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155;">
          <p style="margin: 0; font-size: 11px; color: #475569;">
            Powered by <strong style="color: #d9f99d;">ClubGrid</strong>
          </p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #475569;">
            <a href="https://clubgrid.app" style="color: #94a3b8; text-decoration: none;">clubgrid.app</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`
}

/**
 * Generate plain text version of the invite email
 */
export function generateInviteEmailText({
  fullName,
  clubName,
  role,
  inviteUrl,
  expiresIn = '7 Tagen'
}) {
  const roleLabels = {
    admin: 'Administrator',
    coach: 'Trainer',
    player: 'Spieler',
  }

  const roleLabel = roleLabels[role] || role

  return `
Hallo ${fullName}!

Du wurdest eingeladen, dem Verein "${clubName}" als ${roleLabel} beizutreten.

Klicke auf den folgenden Link, um dein Konto zu erstellen und die Einladung anzunehmen:

${inviteUrl}

Diese Einladung ist ${expiresIn} gültig.

---
Diese E-Mail wurde automatisch gesendet.
Falls du diese Einladung nicht erwartet hast, kannst du sie ignorieren.

--
Powered by ClubGrid
https://clubgrid.app
`.trim()
}
