import anthropic
from typing import AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """\
You are BookBot, a friendly and knowledgeable AI shopping assistant for an online bookstore.

Your capabilities:
- Search for books by title, author, genre, topic, or mood
- Recommend books based on user preferences and what's popular
- Answer questions about books (plot summaries, reading level, similar titles)
- Help users manage their cart
- Explain pricing, availability, and bestseller rankings

Rules:
- ONLY recommend books that exist in the store's catalog (provided in context below)
- When suggesting books, always include their IDs in the structured format
- Format book suggestions using the exact JSON block format so the frontend can render cards
- If asked about a book not in the catalog, say so honestly
- Keep responses concise and conversational (2-3 sentences max, then book cards)
- If the user's intent is ambiguous, ask ONE clarifying question
- Never make up book details — only use what is in the context

Response format for book suggestions — when recommending specific books, output a JSON block:
[BOOKS]{"ids": ["<uuid>", "<uuid>"]}[/BOOKS]

Replace <uuid> with the actual book IDs from the context. Only include IDs that appear in the context.
"""


def _format_context(books: list[dict]) -> str:
    lines = []
    for b in books:
        lines.append(
            f"ID: {b['id']}\n"
            f"Title: {b['title']}\n"
            f"Author: {b['author']}\n"
            f"Category: {b['category']}\n"
            f"Price: ${float(b.get('price', 0)):.2f}\n"
            f"Description: {b.get('description', 'N/A')}\n"
        )
    return "\n---\n".join(lines)


async def stream_chat(
    message: str,
    books_context: list[dict],
) -> AsyncGenerator[str, None]:
    if not settings.anthropic_api_key:
        yield "BookBot is not configured (missing ANTHROPIC_API_KEY)."
        return

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    context_text = _format_context(books_context)

    messages = [
        {
            "role": "user",
            "content": (
                f"Store catalog context:\n{context_text}\n\n"
                f"Customer question: {message}"
            ),
        }
    ]

    async with client.messages.stream(
        model=settings.claude_model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def chat(message: str, books_context: list[dict]) -> str:
    chunks: list[str] = []
    async for token in stream_chat(message, books_context):
        chunks.append(token)
    return "".join(chunks)
