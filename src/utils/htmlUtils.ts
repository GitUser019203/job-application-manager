import MarkdownIt from 'markdown-it';

function downloadHTML(htmlContent: string, filename = 'resume.html') {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function saveToHTML(markdown: string): void {
  // Initialize markdown-it
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
  });

  // Customize HR renderer
  md.renderer.rules.hr = () => {
    return '<hr class="border-t-2 border-black my-2 w-full">\n';
  };

  // Convert Markdown to HTML
  const bodyContent = md.render(markdown);

  // Wrap in full HTML structure with Tailwind CDN
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
</head>
<body class="p-8 prose max-w-none space-y-0.5 text-[10px]">
  ${bodyContent}
</body>
</html>
  `.trim();

  // Trigger download
  downloadHTML(htmlContent, 'resume.html');
}