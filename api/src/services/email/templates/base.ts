const styles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #ffffff;
  `,
  header: `
    text-align: center;
    margin-bottom: 32px;
  `,
  content: `
    color: #333333;
    font-size: 16px;
    line-height: 1.6;
  `,
  button: `
    display: inline-block;
    padding: 14px 32px;
    background-color: #0066cc;
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 24px 0;
  `,
  footer: `
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eeeeee;
    color: #888888;
    font-size: 14px;
    text-align: center;
  `,
  muted: `
    color: #888888;
    font-size: 14px;
  `,
};

export const wrapHtml = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="${styles.container}">
    ${content}
    <div style="${styles.footer}">
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const buttonHtml = (href: string, text: string): string =>
  `<a href="${href}" style="${styles.button}">${text}</a>`;

export { styles };
