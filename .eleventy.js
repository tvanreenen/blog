module.exports = function(eleventyConfig) {
    // allows assetes to be colocated with the posts
    eleventyConfig.addPassthroughCopy("posts/**/*.{jpg,jpeg,png,gif,svg,webp,pdf}");
    // Copy CSS files
    eleventyConfig.addPassthroughCopy("css");
    // allows the post to be organized by folder
    eleventyConfig.addCollection("posts", function(collection) {
        return collection.getFilteredByGlob("posts/**/index.md");
    });
}; 