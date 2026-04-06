import parse, { domToReact } from "html-react-parser";
import { Link } from "react-router-dom";

const parseOptions = {
  replace(node) {
    if (node.type !== "tag") {
      return undefined;
    }

    if (node.name === "a" && node.attribs?.href?.startsWith("/")) {
      const { href, ...rest } = node.attribs;

      return (
        <Link {...rest} to={href}>
          {domToReact(node.children, parseOptions)}
        </Link>
      );
    }

    return undefined;
  },
};

export function RichContent({ html, className = "" }) {
  return <div className={`content-prose ${className}`.trim()}>{parse(html, parseOptions)}</div>;
}
