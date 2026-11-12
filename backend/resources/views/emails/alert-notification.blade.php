<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AQUANICS Alert</title>
  </head>
  <body style="margin: 0; padding: 24px; background: #f1f5f9; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dbeafe; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
      <div style="background: linear-gradient(135deg, #0f766e 0%, #14532d 100%); padding: 24px 28px; color: #ffffff;">
        <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.9;">AQUANICS</div>
        <h1 style="margin: 8px 0 0; font-size: 26px; line-height: 1.2;">Critical Sensor Alert</h1>
      </div>

      <div style="padding: 28px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #475569;">
          A sensor on your aquaponics system has moved outside its configured safe operating range.
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #dc2626; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #dc2626; font-weight: bold; margin-bottom: 8px;">{{ ucfirst($alert->severity) }}</div>
          <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #0f172a;">{{ $alert->title }}</div>
          <div style="font-size: 15px; line-height: 1.6; color: #334155;">{{ $alert->message }}</div>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 18px; font-size: 14px; color: #0f172a;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 40%; color: #475569;">Sensor</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{ $sensorName }}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Current reading</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{ $alert->value !== null ? $alert->value : 'N/A' }} {{ $alert->unit ?? '' }}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Expected safe range</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{ $safeRange }}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Date &amp; time</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{{ $generatedAt }}</td>
          </tr>
        </table>

        <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #0f766e; font-weight: bold; margin-bottom: 8px;">Recommended action</div>
          <div style="font-size: 14px; line-height: 1.6; color: #134e4a;">{{ $recommendedAction }}</div>
        </div>

        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #64748b;">
          This alert is generated automatically by AQUANICS. Please review the system and confirm that the safe operating conditions are restored.
        </p>
      </div>
    </div>
  </body>
</html>
