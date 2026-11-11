import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "../components/not-found-page";
import { pageHead } from "../site";
export const Route = createFileRoute("/404")({
  head: () => pageHead("Page not found", "This page could not be found.", "/404"),
  component: NotFoundPage,
});
