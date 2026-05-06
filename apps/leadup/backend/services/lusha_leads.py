from __future__ import annotations
import logging
from typing import Optional
import httpx
from config import get_settings

logger = logging.getLogger(__name__)

# ── Flip to False when ready to use real Lusha credits ──────────────────────
MOCK_MODE = True

LUSHA_BASE = "https://api.lusha.com"
SEARCH_URL = f"{LUSHA_BASE}/v2/prospecting/contact/search"
REVEAL_URL = f"{LUSHA_BASE}/v1/contact"

# ---------------------------------------------------------------------------
# Mock data — 25 realistic construction/reform companies in Spain
# ---------------------------------------------------------------------------
_MOCK_LEADS = [
    {"company_name": "Reformas Integral Madrid SL", "company_city": "Madrid", "company_website": "reformasintegralmadrid.es", "contact_name": "Carlos Martínez García", "contact_title": "Gerente", "contact_email": "carlos@reformasintegralmadrid.es", "phone_prefix": "691", "is_mobile": True},
    {"company_name": "Construcciones Hernández e Hijos", "company_city": "Barcelona", "company_website": "construccioneshernandez.com", "contact_name": "José Luis Hernández", "contact_title": "Director General", "contact_email": "jluis@construccioneshernandez.com", "phone_prefix": "656", "is_mobile": True},
    {"company_name": "Obra y Reforma Valencia SL", "company_city": "Valencia", "company_website": "obrayreformavalencia.es", "contact_name": "Ana Torres Ruiz", "contact_title": "CEO", "contact_email": "ana@obrayreformavalencia.es", "phone_prefix": "722", "is_mobile": True},
    {"company_name": "Constructora Sánchez Sevilla", "company_city": "Sevilla", "company_website": "constructorasanchez.es", "contact_name": "Manuel Sánchez López", "contact_title": "Propietario", "contact_email": "manuel@constructorasanchez.es", "phone_prefix": "677", "is_mobile": True},
    {"company_name": "Reformas Express Bilbao", "company_city": "Bilbao", "company_website": "reformasexpressbilbao.com", "contact_name": "Iñaki Etxebarria", "contact_title": "Fundador", "contact_email": "inaki@reformasexpressbilbao.com", "phone_prefix": "634", "is_mobile": True},
    {"company_name": "Grupo Constructor Alicante", "company_city": "Alicante", "company_website": "grupoconstrucalicante.es", "contact_name": "Pedro Gómez Navarro", "contact_title": "Gerente", "contact_email": "pedro@grupoconstrucalicante.es", "phone_prefix": "695", "is_mobile": True},
    {"company_name": "Rehabilitaciones Murcia SL", "company_city": "Murcia", "company_website": "rehabilitacionesmurcia.es", "contact_name": "Laura Jiménez Vera", "contact_title": "Directora", "contact_email": "laura@rehabilitacionesmurcia.es", "phone_prefix": "711", "is_mobile": True},
    {"company_name": "Obras y Servicios Zaragoza", "company_city": "Zaragoza", "company_website": "obraszaragoza.com", "contact_name": "Francisco Molina", "contact_title": "CEO", "contact_email": "fmolina@obraszaragoza.com", "phone_prefix": "648", "is_mobile": True},
    {"company_name": "Reformas Premium Málaga SL", "company_city": "Málaga", "company_website": "reformaspremiummalaga.es", "contact_name": "Diego Ruiz Fernández", "contact_title": "Socio Director", "contact_email": "diego@reformaspremiummalaga.es", "phone_prefix": "602", "is_mobile": True},
    {"company_name": "Albañilería Moderna Córdoba", "company_city": "Córdoba", "company_website": "albanileriamodernacordoba.es", "contact_name": "Antonio Moreno Quesada", "contact_title": "Propietario", "contact_email": "amoreno@albanileriacordoba.es", "phone_prefix": "666", "is_mobile": True},
    {"company_name": "Construcciones Valladolid SL", "company_city": "Valladolid", "company_website": "construccionesvalladolid.com", "contact_name": "Roberto Alonso Pardo", "contact_title": "Gerente", "contact_email": "ralonso@construvalladolid.es", "phone_prefix": "683", "is_mobile": True},
    {"company_name": "Reformas Integrales Vigo", "company_city": "Vigo", "company_website": "reformasvigo.es", "contact_name": "Xosé Fernández Iglesias", "contact_title": "Fundador", "contact_email": "xfernandez@reformasvigo.es", "phone_prefix": "619", "is_mobile": True},
    {"company_name": "Grupo Reformas Alicante Norte", "company_city": "Alicante", "company_website": "reformasalicantenorte.com", "contact_name": "Sergio Pérez Blanco", "contact_title": "Director", "contact_email": "sperez@reformasalicantenorte.com", "phone_prefix": "745", "is_mobile": True},
    {"company_name": "Construcciones García Salamanca", "company_city": "Salamanca", "company_website": "construgarciasalamanca.es", "contact_name": "Miguel Ángel García", "contact_title": "CEO", "contact_email": "magarcia@construgarcia.es", "phone_prefix": "671", "is_mobile": True},
    {"company_name": "Reformas del Hogar Granada SL", "company_city": "Granada", "company_website": "reformashogargranad.es", "contact_name": "Carmen López Vidal", "contact_title": "Socia Gerente", "contact_email": "clopez@reformashogar.es", "phone_prefix": "628", "is_mobile": True},
    {"company_name": "Obras Rápidas Vitoria SL", "company_city": "Vitoria", "company_website": "obrasrapidasvitoria.com", "contact_name": "Gorka Zubieta", "contact_title": "Gerente", "contact_email": "gzubieta@obrasrapidasvitoria.com", "phone_prefix": "688", "is_mobile": True},
    {"company_name": "Reformas Palma Mallorca SL", "company_city": "Palma de Mallorca", "company_website": "reformaspalma.es", "contact_name": "Joan Sastre Riera", "contact_title": "Propietario", "contact_email": "jsastre@reformaspalma.es", "phone_prefix": "610", "is_mobile": True},
    {"company_name": "Constructora Las Palmas SL", "company_city": "Las Palmas", "company_website": "constructoralaspalmas.com", "contact_name": "Alejandro Suárez", "contact_title": "Director Comercial", "contact_email": "asuarez@constlaspalmas.com", "phone_prefix": "653", "is_mobile": True},
    {"company_name": "Rehabilitación Inmuebles Santander", "company_city": "Santander", "company_website": "rehabilitacionsantander.es", "contact_name": "Elena Gutiérrez", "contact_title": "Gerente", "contact_email": "egutierrez@rehabsantander.es", "phone_prefix": "699", "is_mobile": True},
    {"company_name": "Obras y Reformas Pamplona", "company_city": "Pamplona", "company_website": "reformaspamplona.com", "contact_name": "Javier Iribarren", "contact_title": "CEO", "contact_email": "jiribarren@reformaspamplona.com", "phone_prefix": "617", "is_mobile": True},
    {"company_name": "Construcciones Rivas Madrid", "company_city": "Madrid", "company_website": "construrivasmadrid.es", "contact_name": "Pablo Rivas Ortega", "contact_title": "Fundador", "contact_email": "privas@construrivas.es", "phone_prefix": "672", "is_mobile": True},
    {"company_name": "Reformas Integrales Tarragona", "company_city": "Tarragona", "company_website": "reformastarragona.es", "contact_name": "Marc Puig Vila", "contact_title": "Gerente", "contact_email": "mpuig@reformastarragona.es", "phone_prefix": "636", "is_mobile": True},
    {"company_name": "Grupo Constructor Sur", "company_city": "Cádiz", "company_website": "grupoconstructorsur.es", "contact_name": "Fernando Morales", "contact_title": "Director", "contact_email": "fmorales@grupconsur.es", "phone_prefix": "647", "is_mobile": True},
    {"company_name": "Reformas Castellón SL", "company_city": "Castellón", "company_website": "reformascastellon.com", "contact_name": "Amparo Vidal Soler", "contact_title": "Propietaria", "contact_email": "avidal@reformascastellon.com", "phone_prefix": "618", "is_mobile": True},
    {"company_name": "Construcciones Murales Logroño", "company_city": "Logroño", "company_website": "construmurallogrono.es", "contact_name": "Raúl Martínez Sainz", "contact_title": "Gerente", "contact_email": "rmartinez@construlogrono.es", "phone_prefix": "655", "is_mobile": True},
]


def _headers() -> dict:
    return {
        "api_key": get_settings().lusha_api_key,
        "Content-Type": "application/json",
    }


def _is_mobile_prefix(phone_str: str) -> bool:
    """Detect Spanish mobile: starts with 6, 7, or +34 followed by 6/7."""
    if not phone_str:
        return False
    cleaned = phone_str.strip().replace(" ", "").replace("-", "")
    if cleaned.startswith("+34"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0034"):
        cleaned = cleaned[4:]
    elif cleaned.startswith("34") and len(cleaned) == 11:
        cleaned = cleaned[2:]
    return cleaned.startswith("6") or cleaned.startswith("7")


def _mask_phone(prefix: str) -> str:
    """Turn 3-digit prefix into display string: '6XX XXX XXX'."""
    if not prefix:
        return "6XX XXX XXX"
    p = prefix.strip()
    return f"{p}X XXX XXX"


async def search_construction_leads(count: int = 25) -> list[dict]:
    if MOCK_MODE:
        logger.info(f"[MOCK] Returning {min(count, len(_MOCK_LEADS))} mock leads (no Lusha credit spent)")
        return [
            {**lead, "lusha_person_id": f"mock_{i+1}", "phone_revealed": False, "company_industry": "Construcción / Reformas"}
            for i, lead in enumerate(_MOCK_LEADS[:count])
        ]
    """
    Search Lusha for Spanish construction/reform company contacts.
    Returns list of dicts with company + contact info.
    """
    settings = get_settings()
    if not settings.lusha_api_key:
        raise ValueError("LUSHA_API_KEY not configured")

    payload = {
        "filter": {
            "countries": ["ES"],
            "jobTitles": [
                "CEO", "Director", "Gerente", "Propietario",
                "Owner", "Founder", "Managing Director"
            ],
            "industries": [
                "Construction", "Real Estate", "Architecture & Planning"
            ],
        },
        "page": 1,
        "pageSize": count,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(SEARCH_URL, headers=_headers(), json=payload)

    if resp.status_code == 402:
        raise RuntimeError("Lusha: créditos insuficientes o plan no permite prospecting")
    if resp.status_code == 401:
        raise RuntimeError("Lusha: API key inválida")
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Lusha search error {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    contacts_raw = data.get("contacts", data.get("data", []))

    results = []
    for c in contacts_raw:
        # Extract phone prefix (Lusha free tier gives first 3 digits)
        phone_data = c.get("phone", c.get("mobilePhone", {}))
        if isinstance(phone_data, dict):
            raw_phone = phone_data.get("rawNumber", phone_data.get("number", ""))
        else:
            raw_phone = str(phone_data) if phone_data else ""

        prefix = raw_phone[:3] if raw_phone else ""
        is_mobile = _is_mobile_prefix(raw_phone) if raw_phone else False

        company_data = c.get("company", c.get("organization", {}))
        company_name = company_data.get("name", c.get("companyName", "")) if isinstance(company_data, dict) else str(company_data)
        company_domain = company_data.get("domain", company_data.get("website", "")) if isinstance(company_data, dict) else ""

        email_data = c.get("email", {})
        email = email_data.get("email", "") if isinstance(email_data, dict) else str(email_data or "")

        results.append({
            "lusha_person_id": str(c.get("id", c.get("personId", ""))),
            "contact_name": f"{c.get('firstName', '')} {c.get('lastName', '')}".strip(),
            "contact_title": c.get("jobTitle", c.get("title", "")),
            "contact_email": email,
            "phone_prefix": prefix,
            "phone_revealed": False,
            "is_mobile": is_mobile,
            "company_name": company_name,
            "company_website": company_domain,
            "company_city": _extract_city(c),
            "company_industry": "Construcción / Reformas",
        })

    return results


def _extract_city(contact: dict) -> str:
    loc = contact.get("location", contact.get("address", {}))
    if isinstance(loc, dict):
        return loc.get("city", loc.get("locality", "España"))
    return "España"


async def reveal_phone(lusha_person_id: str) -> Optional[str]:
    if MOCK_MODE:
        import random
        prefixes = ["691", "656", "722", "677", "634", "695", "711", "648", "602", "666"]
        prefix = lusha_person_id.replace("mock_", "") if lusha_person_id.startswith("mock_") else "6"
        # Use the stored prefix if available, else generate random digits
        rand_suffix = "".join([str(random.randint(0, 9)) for _ in range(6)])
        phone = f"+34 {prefix[:3]} {rand_suffix[:3]} {rand_suffix[3:]}"
        logger.info(f"[MOCK] Reveal phone for {lusha_person_id}: {phone} (no Lusha credit spent)")
        return phone
    """
    Call Lusha to reveal full phone number for a contact.
    This costs a Lusha credit.
    Returns the full phone number string or None.
    """
    settings = get_settings()
    if not settings.lusha_api_key:
        raise ValueError("LUSHA_API_KEY not configured")

    url = f"{REVEAL_URL}?personId={lusha_person_id}&properties=phone"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers=_headers())

    if resp.status_code == 402:
        raise RuntimeError("Lusha: sin créditos para revelar teléfono")
    if resp.status_code == 401:
        raise RuntimeError("Lusha: API key inválida")
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Lusha reveal error {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    # Try multiple response shapes Lusha may return
    phone = (
        data.get("phone", {}).get("rawNumber")
        or data.get("mobilePhone", {}).get("rawNumber")
        or data.get("data", {}).get("phone", {}).get("rawNumber")
        or data.get("phoneNumbers", [None])[0]
    )
    return phone
