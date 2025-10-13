
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface PreviewProps {
  markdown: string;
}

const Preview: React.FC<PreviewProps> = ({ markdown }) => {
  return (
      <ReactMarkdown
      components={{
                  // Map `h1` (`# heading`) to use `h2`s.
                  // Rewrite `em`s (`*like so*`) to `i` with a red foreground color.
                  h1(props) {
                    const {node, ...rest} = props
                    return <h1 style={{'fontSize': '2em'}} {...rest} />
                  },
                  h2(props) {
                    const {node, ...rest} = props
                    return <h2 style={{'fontSize': '1.5em'}} {...rest} />
                  },
                  h3(props) {
                    const {node, ...rest} = props
                    return <h3 style={{'fontSize': '1.17em'}} {...rest} />
                  },
                  h4(props) {
                    const {node, ...rest} = props
                    return <h4 style={{'fontSize': '1em'}} {...rest} />
                  },
                  h5(props) {
                    const {node, ...rest} = props
                    return <h5 style={{'fontSize': '0.83em'}} {...rest} />
                  },
                  h6(props) {
                    const {node, ...rest} = props
                    return <h6 style={{'fontSize': '0.67em'}} {...rest} />
                  }
                }}
      
      >{markdown}</ReactMarkdown>
  );
};

export default Preview;