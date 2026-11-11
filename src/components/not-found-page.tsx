import { Link } from "@tanstack/react-router";
export function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="eyebrow">404</p>
      <h1>Page not found.</h1>
      <p>This page may have moved or no longer exists.</p>
      <Link to="/">Back to all writing</Link>
    </section>
  );
}
