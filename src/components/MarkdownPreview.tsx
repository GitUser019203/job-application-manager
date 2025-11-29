
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface PreviewProps {
  markdown: string;
}

const Preview: React.FC<PreviewProps> = ({ markdown }) => {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        // Map `h1` (`# heading`) to use `h2`s.
        // Rewrite `em`s (`*like so*`) to `i` with a red foreground color.
        h1(props) {
          const { node, ...rest } = props
          return <h1 style={{ 'fontSize': '2em' }} {...rest} />
        },
        h2(props) {
          const { node, ...rest } = props
          return <h2 style={{ 'fontSize': '1.5em' }} {...rest} />
        },
        h3(props) {
          const { node, ...rest } = props
          return <h3 style={{ 'fontSize': '1.17em' }} {...rest} />
        },
        h4(props) {
          const { node, ...rest } = props
          return <h4 style={{ 'fontSize': '1em' }} {...rest} />
        },
        h5(props) {
          const { node, ...rest } = props
          return <h5 style={{ 'fontSize': '0.83em' }} {...rest} />
        },
        h6(props) {
          const { node, ...rest } = props
          return <h6 style={{ 'fontSize': '0.67em' }} {...rest} />
        },
        li(props) {
          const { node, ...rest } = props
          return <li>{rest.children}</li>
        },
        ol(props) {
          const { node, ...rest } = props
          return <ol className="pl-5 list-decimal" {...rest} />
        },
        ul(props) {
          const { node, ...rest } = props
          return <ul className="pl-5 list-disc" {...rest} />
        },
        hr(props) {
          const { node, ...rest } = props
          return <hr className="border-t-2 border-black my-2 w-full" {...rest} />
        },
        blockquote(props) {
          const { node, ...rest } = props
          return <blockquote className="pl-12" {...rest} />
        }
      }}

    >{markdown}</ReactMarkdown>
  );
};

export default Preview;