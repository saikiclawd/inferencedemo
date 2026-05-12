from typing import AsyncGenerator

from openai import AsyncOpenAI

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
- Never make up book details -- only use what is in the context
- Answer directly for the customer. Do not include hidden reasoning, chain-of-thought, or <think> tags.

Response format for book suggestions -- when recommending specific books, output a JSON block:
[BOOKS]{"ids": ["<uuid>", "<uuid>"]}[/BOOKS]

Replace <uuid> with the actual book IDs from the context. Only include IDs that appear in the context.
"""


def _format_context(books: list[dict]) -> str:
    if not books:
        return "No catalog matches were retrieved for this question."

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


def _client() -> AsyncOpenAI:
    return AsyncOpenAI(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        timeout=settings.llm_timeout_seconds,
    )


def _messages(message: str, books_context: list[dict]) -> list[dict[str, str]]:
    context_text = _format_context(books_context)
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Store catalog context:\n{context_text}\n\n"
                f"Customer question: {message}"
            ),
        },
    ]


async def stream_chat(
    message: str,
    books_context: list[dict],
) -> AsyncGenerator[str, None]:
    if not settings.llm_base_url or not settings.llm_model:
        yield "BookBot is not configured. Set LLM_BASE_URL and LLM_MODEL for the SGLang server."
        return

    try:
        stream = await _client().chat.completions.create(
            model=settings.llm_model,
            messages=_messages(message, books_context),
            max_tokens=settings.llm_max_tokens,
            temperature=settings.llm_temperature,
            stream=True,
        )

        async for chunk in stream:
            if not chunk.choices:
                continue
            token = chunk.choices[0].delta.content
            if token:
                yield token
    except Exception:
        yield "BookBot cannot reach the local SGLang model server right now. Please try again shortly."


async def chat(message: str, books_context: list[dict]) -> str:
    chunks: list[str] = []
    async for token in stream_chat(message, books_context):
        chunks.append(token)
    return "".join(chunks)
