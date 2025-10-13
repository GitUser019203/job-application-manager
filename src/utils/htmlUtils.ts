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

  // Convert Markdown to HTML
  const htmlContent = md.render(markdown);

  // Trigger download
  downloadHTML(htmlContent, 'resume.html');
}