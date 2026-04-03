from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ArewaPay API"
    debug: bool = False

    database_url: str = "postgresql+psycopg2://arewapay:arewapay@localhost:5432/arewapay"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cookie_domain: str | None = None
    cookie_secure: bool = False

    resend_api_key: str | None = None  # env: RESEND_API_KEY
    email_from: str = "onboarding@resend.dev"
    public_app_url: str = "http://localhost:5173"
    api_public_url: str = "http://localhost:8000"

    revenuecat_webhook_secret: str | None = None
    revenuecat_premium_product_ids: str = ""
    revenuecat_unlimited_product_ids: str = ""

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
