---
title: Embeddings — A Mathematical Rosetta Stone for Generative AI
date: git Created
summary: An introduction to how large language models represent meaning using high-dimensional vector space — showing how machines interpret, connect, and generate human-like language in context.
---

This is one of those posts that I put together for my own edification in my personal [Obsidian](https://obsidian.md/) vault. But it ulimately derived from a [Jupyter](https://jupyter.org/) notebook that I put together when I was first trying to understand some of the foundational concepts behind generative AI.

One of the first big questions I had was:

> How do you turn open-ended input — like text, audio, or video — into something a predictive model like GPT can actually work with?

The answer begins with [embeddings](https://en.wikipedia.org/wiki/Word_embedding).


### Embedding Concepts in Space

In mathematical terms, embeddings are represented as [vectors](https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics)) — long lists of numbers where each value reflects how much a concept aligns with a particular, learned dimension of meaning.

For example, let's take the phrase `"hot dog"` and see what its embedding looks like when processed through [OpenAI](https://openai.com/)'s `text-embedding-3-small` model:


```python
embedding('hot dog')
```

This returns a vector — an array of 1,536 numbers — that uniquely points to the concept of "hot dog" in high-dimensional space. Each number describes how strongly "hot dog" aligns with a particular learned dimension of meaning.

```python
array([-0.03104307, -0.04807128, -0.01409304, ..., -0.00020377, 0.0029014 , -0.0072846 ], shape=(1536,))
```

### Understanding Dimensionality

But what do all the number really mean? Where GPS has 2 dimensions (latitude and longitude), and physical space has 3 (x, y, z), large language models like GPT operate in high-dimensional space — in this case, 1,536 dimensions.

The impact of each dimension on meaning isn't explicitly labeled (like "happiness" or "animal-ness"). But during training, the model learns to organize these dimensions in ways that reflect meaning. Each one ends up capturing some subtle influence on a concept's overall representation.

### Comparing Similarity

Beyond embedding a single concept in space. A powerful feature of embeddings is that we can compare concepts mathematically. One popular technique is [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity), which measures the angle between two vectors rather than their literal distance.

Cosine similarity returns values from -1 to 1:
* Closer to 1 indicates that the vectors are pointed in the same direction (meaning very similar)
* Closer to 0 indicates that they are orthogonal or have no similarity
* Closer to -1 indicates that they are in exactly opposite directions (meaning they are dissimilar)

With concepts represented mathematically, this one little tool gives us the ability to uncover how concepts are related beneath the surface — not just by spelling or syntax, but by highly nuanced dimensions of meaning.

To explore this, let's start with a simple list of words (or tokens).

```python
words = [
    "man", "woman", "king", "queen", "boy", "girl", "prince", "princess",
    "father", "mother", "husband", "wife", "son", "daughter", "friend",
    "enemy", "teacher", "student", "boss", "employee", "doctor", "nurse",
    "potatoes", "cheese", "hamburger", "french fries", "cheeseburger",
    "banana", "chocolate", "cake", "cheesecake", "bacon", "pancakes",
    "avocado", "salad", "peanut butter", "toast", "burrito", "sushi",
    "pizza", "ice cream", "cookie", "hot dog",
    "soda", "water", "milk", "la croix", "coffee", "latte", "espresso",
    "mocha", "tea", "hot chocolate", "cappuccino", "matcha", "smoothie",
    "kombucha", "wine", "beer", "cocktail", "lemonade",
    "red", "blue", "green", "yellow", "brown", "black", "white", "orange",
    "pink", "purple", "beige", "gray", "neon", "clear", "golden",
    "crispy", "fizzy", "sweet", "salty", "creamy", "hot", "cold", "spicy",
    "refreshing", "bitter", "sour", "smooth", "crunchy", "bubbly", "strong",
    "light", "dark"
]
```

Let's embed the word `"burrito"` and see which other words from our list are most similar:

```python
find_similar_concepts(embedding('burrito'), filter=["burrito"])
```
|   | word         | embedding                                           | similarity |
|---|--------------|-----------------------------------------------------|------------|
| 0 | cheeseburger | [-0.025503935292363167, -0.05670874938368797, ...]  | 0.512808   |
| 1 | hamburger    | [-0.046442754566669464, -0.056426260620355606, ...] | 0.476006   |
| 2 | hot dog      | [-0.031043073162436485, -0.048071280121803284, ...] | 0.433672   |
| 3 | bacon        | [0.027432523667812347, -0.007462325040251017, ...]  | 0.423240   |
| 4 | sushi        | [-0.023778622969985008, -0.025500649586319923, ...] | 0.408351   |

We can see that "burrito" clusters with other savory foods — especially those in the fast food or protein-heavy category.

### Refining Meaning Through Vector Arithmetic

Now that we've seen how embeddings represent individual concepts in high-dimensional space and how they can be compared, a natural next step is to explore how meaning can be manipulated mathematically.

One powerful property of vectors is that they support meaningful arithmetic. By adding, subtracting, or blending vectors, we can produce new representations that reflect combined or transformed meanings — a fundamental mechanism used in the internal computation of models like GPT.

Let's look at a few examples within our word list.

```python
find_similar_concepts(
  embedding('milk') + embedding('espresso'),
  filter=["milk", "espresso"]
)
```

|   | word           | embedding                                          | similarity |
|---|----------------|----------------------------------------------------|------------|
| 0 | cappuccino     | [-0.02482164278626442, -0.030885322019457817, ...] | 0.642723   |
| 1 | latte          | [-0.017921417951583862, -0.03153694421052933, ...] | 0.577750   |
| 2 | mocha          | [0.02025661990046501, -0.026742229238152504, ...]  | 0.562984   |
| 3 | chocolate      | [0.013673103414475918, -0.04669247195124626, ...]  | 0.536867   |
| 4 | hot chocolate  | [-0.04974162578582764, -0.04538385942578316, ...]  | 0.518881   |


```python
find_similar_concepts(
  embedding('father') - embedding('man') + embedding('woman'),
  filter=["father", "man", "woman"]
)
```

|   | word     | embedding                                          | similarity  |
|---|----------|----------------------------------------------------|-------------|
| 0 | mother   | [0.06384002417325974, 0.002675893483683467, ...]   | 0.747128    |
| 1 | daughter | [0.07486723363399506, -0.017612170428037643, ...]  | 0.610720    |
| 2 | wife     | [0.017703169956803322, 0.0015181683702394366, ...] | 0.579919    |
| 3 | queen    | [0.043817322701215744, -0.03984493762254715, ...]  | 0.423459    |
| 4 | friend   | [-0.017377346754074097, -0.03304498642683029, ...] | 0.411813    |


These examples further demonstrate how embeddings capture both meaning and similarity. But in language, meaning isn't just about what words are present — it's also about where they appear. The phrases "dog bites man" and "man bites dog" contain the same words, but carry very different meanings.

To account for this, after converting tokens into vectors, GPT models apply positional embeddings — learned vectors that encode each word's position in the sequence. Just as we combined "milk" and "espresso" to create a new concept like "cappuccino", GPT adds a learned position vector to each token's meaning vector — effectively saying, "this word means this, here."

This positional context is essential to how GPT models understand and generate coherent language — but it's a deeper topic, likely worth a post of its own.

### Words vs Tokens

Just to clarify — when I mention *tokens*, it's important to know that an embedding doesn't always represent a single word. In fact, embeddings can capture the meaning of a whole string of words, a phrase, or even a sentence.

There are many different strategies for how text is split into tokens, depending on the model and the task — but that's a topic for another post.

For now, it'll suffice to demonstrate the same vector-based similarity of full phrases against out word list.

```python
find_similar_concepts(calculate_embedding('dessert you eat with a spoon'))
```

|   | word       | embedding                                           | similarity |
|---|------------|-----------------------------------------------------|------------|
| 0 | ice cream  | [0.015797361731529236, -0.0515950508415699, ...]    | 0.449068   |
| 1 | cheesecake | [0.04396495223045349, -0.02441263012588024, ...]    | 0.435389   |
| 2 | smoothie   | [-0.022336609661579132, -0.034296080470085144, ...] | 0.403105   |
| 3 | cake       | [0.04641443118453026, -0.009220455773174763, ...]   | 0.396299   |
| 4 | creamy     | [0.049029696732759476, -0.008617117069661617, ...]  | 0.378161   |

```python
find_similar_concepts(calculate_embedding('members of a family'))
```

|   | word     | embedding                                          | similarity |
|---|----------|----------------------------------------------------|------------|
| 0 | father   | [0.02880435809493065, 0.024050738662481308, ...]   | 0.469758   |
| 1 | daughter | [0.07486723363399506, -0.017612170428037643, ...]  | 0.445740   |
| 2 | mother   | [0.06384002417325974, 0.002675893483683467, ...]   | 0.433022   |
| 3 | wife     | [0.017703169956803322, 0.0015181683702394366, ...] | 0.423573   |
| 4 | husband  | [-0.019892802461981773, 0.03318863362073898, ...]  | 0.392540   |


### Take Away

A core idea behind large language models (LLMs) is that they are mathematical models of human understanding.

Rather than relying on strict logic or fixed rules, these models represent meaning as positions in a high-dimensional space — where the geometry between points reflects relationships between concepts. This allows computers to interpret meaning, not just match literal words.

And it doesn't stop at language. Today's models are being trained to understand meaning across images, audio, and video — enabling multimodal understanding, a kind of modern-day Rosetta Stone for human perception.

I don't know about you, but as a technologist, I find this to be an incredibly exciting time.

After years of working in a world defined by literal, logical, and deterministic systems, we're now stepping into an era shaped by probabilistic, semantic, and conceptual ones. Just as exciting is how accessible and cost-effective these capabilities have become — not just for researchers, but for everyday developers and creators.

The very nature of how we interact with computers is evolving — and it's happening faster, and at a greater scale, than anything we've seen before.

---

### Appendix

For those interested in replicating the examples shown in this post, here's the initial setup using Python and the OpenAI API:

```python
import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def calculate_cosine_similarity(a, b):
  return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def find_similar_concepts(query_embedding, top_n=5, filter=[]):
    df["similarity"] = df["embedding"].apply(lambda emb: calculate_cosine_similarity(query_embedding, emb))
    result = df[~df["word"].isin(filter)].copy()
    return result.sort_values("similarity", ascending=False).head(top_n).reset_index(drop=True)

def calculate_embedding(text):
  return np.array(client.embeddings.create(input=[text.replace("\n", " ")], model="text-embedding-3-small").data[0].embedding)

def embedding(word):
  return np.array(df.loc[df['word'] == word, 'embedding'].item())

df = pd.DataFrame({
    "word": words,
    "embedding": [calculate_embedding(word) for word in words]
})
```
