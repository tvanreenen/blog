.PHONY: help serve build preview check pages-build clean

help:
	@echo "serve       Start local development with drafts"
	@echo "build       Build the static site without drafts"
	@echo "preview     Serve the built static artifact"
	@echo "check       Run formatting, lint, types, and unit tests"
	@echo "pages-build Install dependencies, check, and build for Cloudflare Pages"
	@echo "clean       Remove generated build and content files"

serve:
	npm run dev

build:
	npm run build

preview:
	npm run preview

check:
	npm run check

pages-build:
	npm ci --include=dev && npm run check && npm run build

clean:
	rm -rf dist .tanstack public/posts public/licenses
	rm -f src/routeTree.gen.ts src/content/manifest.gen.json src/content/articles.gen.ts
