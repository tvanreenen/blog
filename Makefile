.PHONY: help serve watch build pages-build clean

help:
	@echo "Available targets:"
	@echo "  help    - Show this help message"
	@echo "  serve   - Start Eleventy development server with live reload"
	@echo "  watch   - Watch for changes and rebuild without serving"
	@echo "  build   - Build the site without serving"
	@echo "  pages-build - Install, check, and build the static migration for Cloudflare Pages"
	@echo "  clean   - Remove the _site directory"

serve: clean
	npx @11ty/eleventy --serve

watch: clean
	npx @11ty/eleventy --watch

build: clean
	npx @11ty/eleventy

pages-build:
	cd migration && npm ci --include=dev && npm run check && npm run build

clean:
	rm -rf _site/
