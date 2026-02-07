import { Resend } from "resend";

import { env } from "@/env";
import { formatDateBR } from "@/lib/date-br";

const resend = new Resend(env.RESEND_API_KEY);

const FROM_ADDRESS = "Mecânica Fácil <onboarding@resend.dev>";

interface InvitationEmailParams {
	to: string;
	inviterName: string;
	organizationName: string;
	role: string;
	inviteLink: string;
	expiresAt: Date;
}

export async function sendInvitationEmail({
	to,
	inviterName,
	organizationName,
	role,
	inviteLink,
	expiresAt,
}: InvitationEmailParams) {
	const roleName = role === "admin" ? "Administrador" : "Membro";
	const expiresDate = formatDateBR(expiresAt);

	const { error } = await resend.emails.send({
		from: FROM_ADDRESS,
		to,
		subject: `Convite para ${organizationName} — Mecânica Fácil`,
		html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1648ff,#0b3af6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">Mecânica Fácil</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Convite para organização</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Olá,
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                <strong>${inviterName}</strong> convidou você para se juntar à organização
                <strong>${organizationName}</strong> como <strong>${roleName}</strong>.
              </p>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${inviteLink}"
                       style="display:inline-block;background-color:#1648ff;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:-0.01em;">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;padding:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                      <strong style="color:#374151;">Organização:</strong> ${organizationName}
                    </p>
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                      <strong style="color:#374151;">Papel:</strong> ${roleName}
                    </p>
                    <p style="margin:0;color:#6b7280;font-size:13px;">
                      <strong style="color:#374151;">Expira em:</strong> ${expiresDate}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Se você não esperava este convite, pode ignorar este email com segurança.
              </p>
              <p style="margin:12px 0 0;color:#9ca3af;font-size:11px;line-height:1.5;word-break:break-all;">
                Link direto: <a href="${inviteLink}" style="color:#1648ff;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                Mecânica Fácil — Sistema de gestão para oficinas
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
		`.trim(),
	});

	if (error) {
		console.error("[EMAIL] Falha ao enviar convite:", error);
		throw new Error(`Falha ao enviar email: ${error.message}`);
	}
}
