---
layout: "layout.html"
---
## Text Formatting

### Basic Text Styles
This is normal text. **This is bold text**. *This is italic text*. ***This is bold and italic text***. `This is inline code`.

### Text Emphasis
This is <mark>highlighted text</mark>. This is <sup>superscript</sup> and this is <sub>subscript</sub>. This is ~~strikethrough~~ text.

### Links
Here's a [regular link](https://example.com). Here's a link with [title attribute](https://example.com "This is a title"). Here's an [email link](mailto:test@example.com).

## Headings Hierarchy

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Lists

### Unordered Lists
- First level item
  - Second level item
    - Third level item
      - Fourth level item
- Back to first level
  - Another second level
    - Another third level

### Ordered Lists
1. First level item
   1. Second level item
      1. Third level item
         1. Fourth level item
2. Back to first level
   1. Another second level
      1. Another third level

## Code Examples

### Inline Code
This is some text with `inline code` in it. Here's another `example` of inline code.

### Code Blocks
```javascript
function example() {
  console.log("This is a code block");
  return {
    key: "value",
    number: 42
  };
}
```

```python
def example():
    print("This is Python code")
    return {
        "key": "value",
        "number": 42
    }
```

## Blockquotes

Simple Blockquote

> This is a simple blockquote. It can contain multiple lines and other markdown elements like **bold text** or `code`.

Blockquote with Formatted Items

> #### Heading
> This is a blockquote that contains a variety of nested elements.
> 
> - List item with **bold text**
> - List item with *italic text*
>   - Nested item with `code`

## Tables

### Basic Table
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |

### Table with Alignment
| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left         | Center         | Right         |
| Left         | Center         | Right         |

## Horizontal Rules

---

## Images

![Sample Image](https://placehold.co/600x400 "This is a title")

## Long Text Test

This is a long paragraph that tests how the text wraps and flows. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Edge Cases

### Empty Elements

Here's an empty paragraph:



And an empty list:

- 

And an empty blockquote:

>

### Very Long Words
This is a test of verylongwordthatdoesnthaveanyspacesinitandshouldwrapcorrectly.

### Mixed Content
This is a paragraph with **bold text**, *italic text*, `code`, and a [link](https://example.com). It also contains some special characters: © ® ™.

### Multiple Spaces
This  has  multiple  spaces  between  words.

### Line Breaks
This is a line with a  
soft break.

This is a line with a
hard break.
