import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { SiteLayout } from "../components/site-layout";
import { NotFoundPage } from "../components/not-found-page";
import styles from "../styles.css?url";
import geistFont from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import { themeScript } from "../components/theme-toggle";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "preload", href: geistFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootDocument,
  notFoundComponent: NotFoundPage,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <SiteLayout>
          <Outlet />
        </SiteLayout>
        <Scripts />
      </body>
    </html>
  );
}
