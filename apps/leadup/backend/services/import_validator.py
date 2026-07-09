import json
import logging
import re

from anthropic import AsyncAnthropic
from config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()
_client = AsyncAnthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None


def _fallback(columns_found: dict, sample_rows: list[dict], reason: str = "") -> dict:
    """Always returns a safe payload so the frontend can move to step 3."""
    expected = {"company_name", "contact_name", "contact_email", "contact_phone", "website", "city"}
    mapped = set(columns_found.values()) if isinstance(columns_found, dict) else set()
    missing = sorted(expected - mapped)
    pct = round(100 * len(mapped & expected) / max(len(expected), 1))
    return {
        "mapping_correct": bool(mapped),
        "missing_fields": missing,
        "completeness_pct": pct,
        "can_enrich": True,
        "recommendations": reason or f"Validación heurística: {len(sample_rows)} leads, {len(mapped)} columnas mapeadas.",
        "issues": [],
    }


def _extract_json(text: str) -> dict | None:
    """Strip markdown code fences and pull the first JSON object out of the text."""
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        candidate = fence.group(1)
    else:
        brace = re.search(r"\{.*\}", text, re.DOTALL)
        candidate = brace.group(0) if brace else text
    try:
        return json.loads(candidate)
    except Exception:
        return None


async def validate_import(columns_found: dict, sample_rows: list[dict]) -> dict:
    """Validate an imported leads dataset. Never raises — always returns a usable payload."""
    if _client is None:
        return _fallback(columns_found, sample_rows, "ANTHROPIC_API_KEY no configurada — validación heurística.")

    sample_json = json.dumps(sample_rows[:3], indent=2, ensure_ascii=False)
    prompt = f"""Analiza esta importación de leads desde Excel.

Columnas detectadas y su mapeo a campos internos:
{json.dumps(columns_found, indent=2, ensure_ascii=False)}

Primeros leads (sample):
{sample_json}

Tu tarea:
1. Verifica que el mapeo de columnas sea correcto
2. Identifica qué campos IMPORTANTES están faltando (empresa: website, city; contacto: name, email, phone)
3. Evalúa el porcentaje de completitud (0-100)
4. Si faltan campos, sugiere cómo completarlos

Responde SOLO con JSON puro, sin markdown ni explicación:
{{"mapping_correct": true, "missing_fields": ["website","city"], "completeness_pct": 75, "can_enrich": true, "recommendations": "...", "issues": []}}
"""

    try:
        message = await _client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
            timeout=25.0,
        )
        response_text = message.content[0].text if message.content else ""
    except Exception as exc:
        logger.warning(f"validate_import: Anthropic call failed ({exc!r}) — falling back")
        return _fallback(columns_found, sample_rows, f"IA no disponible ({type(exc).__name__}). Validación heurística aplicada.")

    parsed = _extract_json(response_text)
    if not parsed:
        fb = _fallback(columns_found, sample_rows)
        fb["recommendations"] = response_text[:500] or fb["recommendations"]
        return fb

    parsed.setdefault("mapping_correct", True)
    parsed.setdefault("missing_fields", [])
    parsed.setdefault("completeness_pct", 50)
    parsed.setdefault("can_enrich", True)
    parsed.setdefault("recommendations", "")
    parsed.setdefault("issues", [])
    return parsed
