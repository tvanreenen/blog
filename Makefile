.PHONY: help serve watch build clean

help:
	@echo "Available targets:"
	@echo "  help    - Show this help message"
	@echo "  serve   - Start Eleventy development server with live reload"
	@echo "  watch   - Watch for changes and rebuild without serving"
	@echo "  build   - Build the site without serving"
	@echo "  clean   - Remove the _site directory"

serve: clean
	npx @11ty/eleventy --serve

watch: clean
	npx @11ty/eleventy --watch

build: clean
	npx @11ty/eleventy

clean:
	rm -rf _site/ 