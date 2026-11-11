import { Children, isValidElement, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import { WrapText } from "lucide-react";
import { Button } from "./ui/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "./ui/code-block";

type CodeElement = { children?: ReactNode };
type HighlightedPreProps = ComponentProps<"pre"> & {
  "data-code"?: string;
  "data-language"?: string;
};

function ArticleCodeBlock({
  children,
  "data-code": source,
  "data-language": language,
  ...props
}: HighlightedPreProps) {
  const [wrap, setWrap] = useState(false);
  const code = Children.toArray(children).find((child) => isValidElement<CodeElement>(child));
  if (typeof source !== "string" || !isValidElement<CodeElement>(code))
    return <pre {...props}>{children}</pre>;
  const lines = Children.toArray(code.props.children).filter((child) =>
    isValidElement<CodeElement>(child),
  );
  const label =
    language === "text" || !language
      ? "Plain text"
      : language === "python"
        ? "Python"
        : language === "bash"
          ? "Shell"
          : language;
  return (
    <CodeBlock data-not-typeset="" className="article-code">
      <CodeBlockHeader>
        <CodeBlockTitle>{label}</CodeBlockTitle>
        <CodeBlockActions>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Wrap code"
            aria-pressed={wrap}
            onClick={() => setWrap(!wrap)}
          >
            <WrapText aria-hidden="true" />
          </Button>
          <CodeBlockCopyButton value={source} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent wrap={wrap} aria-label={`${label} code`}>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>
            {isValidElement<CodeElement>(line) ? line.props.children : line}
          </CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}

export const articleComponents: MDXComponents = {
  pre: ArticleCodeBlock,
  // oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/prefer-tag-over-role -- This labelled group needs keyboard focus to scroll wide tables, including in Safari.
  table: (props) => (
    <div className="typeset-scroll" role="group" aria-label="Scrollable data table" tabIndex={0}>
      <table {...props} />
    </div>
  ),
  // oxlint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/prefer-tag-over-role
  th: ({ children, ...props }) => (
    <th scope="col" {...props}>
      {Children.toArray(children).some((child) => typeof child !== "string" || child.trim()) ? (
        children
      ) : (
        <span className="sr-only">Row</span>
      )}
    </th>
  ),
};
