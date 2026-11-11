import { Children, isValidElement, useState, useContext } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import { WrapText } from "lucide-react";
import { Button } from "./ui/button";
import { HmacExplorer, HmacBase32 } from "./hmac-explorer";
import { HmacSetup } from "./hmac-setup";
import { HmacExampleContext } from "./hmac-example";
import { HmacClock, HmacSelect, HmacMask, HmacNumber, HmacRemainder } from "./hmac-steps";
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

const liveFigures = {
  "hmac-base32": HmacBase32,
  "hmac-setup": HmacSetup,
  hmac: HmacExplorer,
  "hmac-clock": HmacClock,
  "hmac-select": HmacSelect,
  "hmac-mask": HmacMask,
  "hmac-number": HmacNumber,
  "hmac-remainder": HmacRemainder,
};

function ArticleFigure({
  "data-interactive": interactive,
  children,
  ...props
}: ComponentProps<"figure"> & { "data-interactive"?: string }) {
  const example = useContext(HmacExampleContext);
  const View = interactive ? liveFigures[interactive as keyof typeof liveFigures] : undefined;
  if (!View) return <figure {...props}>{children}</figure>;
  return (
    <figure
      {...props}
      data-interactive={interactive}
      data-not-typeset=""
      className="hmac-explorer"
      aria-busy={example?.pending}
    >
      {example?.enabled ? <View /> : children}
      {!example?.enabled && interactive === "hmac-base32" && (
        <figcaption className="hmac-caption">
          The static figures use the public RFC test secret 12345678901234567890 as ASCII bytes, at
          59 seconds after the Unix epoch, adapted to six digits.
        </figcaption>
      )}
    </figure>
  );
}

export const articleComponents: MDXComponents = {
  figure: ArticleFigure,
  pre: ArticleCodeBlock,
  table: (props) => (
    <div className="typeset-scroll" role="group" aria-label="Scrollable data table" tabIndex={0}>
      <table {...props} />
    </div>
  ),
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
