<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Your Aquanics Password</title>
</head>
<body style="margin:0;background:#f1f5f3;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe9e3;border-radius:16px;">
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 24px;color:#047857;font-size:15px;font-weight:bold;letter-spacing:2px;">AQUANICS</p>
                            <h1 style="margin:0 0 16px;color:#123b2d;font-size:24px;">Reset Your Aquanics Password</h1>
                            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">We received a request to reset your Aquanics account password. Click below to choose a new password.</p>
                            <p style="margin:0 0 24px;">
                                <a href="{{ $resetUrl }}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#059669;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Reset Password</a>
                            </p>
                            <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">This link expires in {{ $expireMinutes }} minutes. If you did not request a password reset, you can safely ignore this email; your password will not change.</p>
                            <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">If the button does not work, copy and paste this link into your browser:<br><a href="{{ $resetUrl }}" style="color:#047857;word-break:break-all;">{{ $resetUrl }}</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
