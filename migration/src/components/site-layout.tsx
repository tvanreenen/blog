import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconBrandGithub, IconBrandLinkedin, IconWorld } from "@tabler/icons-react";
import { site } from "../site";
import { ThemeToggle } from "./theme-toggle";

const profiles = [
  {
    href: site.linkedin,
    icon: IconBrandLinkedin,
    label: "tvanreenen",
    name: "tvanreenen on LinkedIn",
  },
  { href: site.github, icon: IconBrandGithub, label: "tvanreenen", name: "tvanreenen on GitHub" },
  { href: site.companyUrl, icon: IconWorld, label: "tvr.works", name: "tvr.works website" },
  {
    href: site.companyGithub,
    icon: IconBrandGithub,
    label: "tvr-works",
    name: "tvr-works on GitHub",
  },
];

export function SiteLayout({
  children,
  copyrightYear,
}: {
  children: ReactNode;
  copyrightYear: number;
}) {
  return (
    <div className="site-layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <img className="header-avatar" src={site.gravatar} width="56" height="56" alt="" />
        <Link to="/" className="identity">
          {site.name}
        </Link>
        <ThemeToggle />
        <nav className="profile-links" aria-label="Profiles and company">
          {profiles.map(({ icon: Icon, ...profile }) => (
            <a key={profile.href} href={profile.href} aria-label={profile.name}>
              <Icon
                className="profile-icon"
                size={16}
                stroke={2}
                aria-hidden="true"
                focusable="false"
              />
              <span>{profile.label}</span>
            </a>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <p>
          © {copyrightYear} {site.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
