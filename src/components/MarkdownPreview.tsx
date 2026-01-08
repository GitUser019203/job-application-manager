
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface PreviewProps {
  markdown: string;
}

export const ResumeHeader: React.FC<{ name: string; phone: string; email: string; linkedin: string }> = ({ name, phone, email, linkedin }) => (
  <div className="mb-8 border-b border-slate-200 pb-4">
    <div className="text-center mb-4">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">{name}</h1>
    </div>
    <div className="flex justify-between items-center text-sm font-medium text-slate-600 px-2">
      <span>{phone}</span>
      <span>{email}</span>
      <span>{linkedin}</span>
    </div>
  </div>
);

const Preview: React.FC<PreviewProps> = ({ markdown = '' }) => {
  // Check if the markdown starts with or contains our magic header tag
  const headerMatch = (markdown || '').match(/RESUME_HEADER_JSON:({.*?})/);

  let contentToRender = markdown || '';
  let headerComponent: React.ReactNode = null;

  if (markdown && markdown.startsWith('RESUME_HEADER_JSON:')) {
    try {
      // Robust parsing matching ResumeEditor logic
      const jsonPrefix = 'RESUME_HEADER_JSON:';
      const mkTrim = markdown.trimStart();

      if (mkTrim.startsWith(jsonPrefix)) {
        // Direct extraction attempt first for efficiency and simpler logic
        // We need to parse ONLY the JSON object, not the rest of the markdown.
        // Since there might be trailing markdown, we can't just JSON.parse(jsonStr).
        // We'll fall back to the safe regex that captures the first object.
        const match = mkTrim.match(/RESUME_HEADER_JSON:({[\s\S]*?})/);
        if (match) {
          const data = JSON.parse(match[1]);
          headerComponent = <ResumeHeader {...data} />;
          contentToRender = mkTrim.replace(match[0], '').trim();
        } else {
          // Regex failed but prefix is there. It might be malformed or just weirdly formatted.
          // Try to find the end of the JSON object manually (first matching brace pair?)
          // Or, at minimum, strip the line so it doesn't show as raw text.
          const firstLineEnd = mkTrim.indexOf('\n');
          if (firstLineEnd > -1) {
            // Try parsing just the first line?
            try {
              const possibleJson = mkTrim.substring(jsonPrefix.length, firstLineEnd);
              const data = JSON.parse(possibleJson);
              headerComponent = <ResumeHeader {...data} />;
              contentToRender = mkTrim.substring(firstLineEnd).trim();
            } catch (err) {
              // Failed to parse, but let's hide the raw header text anyway by removing it
              contentToRender = mkTrim.substring(firstLineEnd).trim();
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse resume header", e);
    }
  } else if (headerMatch) {
    // Fallback for embedded header
    try {
      const data = JSON.parse(headerMatch[1]);
      headerComponent = <ResumeHeader {...data} />;
      contentToRender = (markdown || '').replace(/RESUME_HEADER_JSON:({.*?})/, '').trim();
    } catch (e) {
      console.error("Failed to parse resume header", e);
    }
  }

  return (
    <div className="prose prose-slate max-w-none">
      {headerComponent}
      <ReactMarkdown
        components={{
          h1(props) {
            const { node, children, ...rest } = props
            return <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-800 border-b border-slate-200 pb-1" {...rest}>{children}</h1>
          },
          h2(props) {
            const { node, children, ...rest } = props
            return <h2 className="text-xl font-bold mt-5 mb-3 text-slate-800 border-b border-slate-200 pb-1" {...rest}>{children}</h2>
          },
          h3(props) {
            const { node, children, ...rest } = props
            return <h3 className="text-lg font-bold mt-4 mb-2 text-slate-800" {...rest}>{children}</h3>
          },
          li(props) {
            const { node, children, ...rest } = props
            return <li className="my-1" {...rest}>{children}</li>
          },
          ol(props) {
            const { node, children, ...rest } = props
            return <ol className="pl-5 list-decimal my-4" {...rest}>{children}</ol>
          },
          ul(props) {
            const { node, children, ...rest } = props
            return <ul className="pl-5 list-disc my-4" {...rest}>{children}</ul>
          },
          hr(props) {
            const { node, ...rest } = props
            return <hr className="border-t-2 border-slate-300 my-6" {...rest} />
          },
          blockquote(props) {
            const { node, children, ...rest } = props
            return <blockquote className="pl-4 border-l-4 border-slate-200 italic text-slate-600 my-4" {...rest}>{children}</blockquote>
          }
        }}
      >{contentToRender}</ReactMarkdown>
    </div>
  );
};

export default Preview;
