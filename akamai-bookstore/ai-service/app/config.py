from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "bookstore"
    postgres_user: str = "bookstore"
    postgres_password: str = "changeme"
    meili_host: str = "http://localhost:7700"
    meili_master_key: str = "changeme-meili-key"
    embedding_model: str = "all-MiniLM-L6-v2"
    rag_top_k_vector: int = 5
    rag_top_k_search: int = 5
    max_context_books: int = 8
    llm_base_url: str = "http://sglang:30000/v1"
    llm_api_key: str = "bookstore-local-key"
    llm_model: str = "Qwen/Qwen3-8B"
    llm_max_tokens: int = 768
    llm_temperature: float = 0.2
    llm_timeout_seconds: float = 120.0

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
