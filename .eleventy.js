module.exports = function(eleventyConfig) {
    // allows assetes to be colocated with the posts
    eleventyConfig.addPassthroughCopy("posts/**/*.{jpg,jpeg,png,gif,svg,webp,pdf}");
    eleventyConfig.addPassthroughCopy("vanreenen-og.png");
    // Copy favicon files
    eleventyConfig.addPassthroughCopy("favicon.ico");
    eleventyConfig.addPassthroughCopy("favicon-32x32.png");
    eleventyConfig.addPassthroughCopy("favicon-16x16.png");
    eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
    // Copy CSS files
    eleventyConfig.addPassthroughCopy("css");
    // allows the post to be organized by folder
    eleventyConfig.addWatchTarget("posts");
    eleventyConfig.addCollection("posts", function(collection) {
        return collection.getFilteredByGlob("posts/**/index.md").sort(function (a, b) {
            return b.date - a.date; // sort by date - descending
        });
    });
}; 