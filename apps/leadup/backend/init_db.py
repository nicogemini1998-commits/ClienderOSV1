"""Inicialización de BD con usuarios y leads de prueba."""

import asyncio
import aiosqlite
import json
from datetime import date
from pathlib import Path

from database import DB_PATH, init_db
from auth import hash_password

INITIAL_USERS = [
    {"name": "Nicolas", "email": "nicolas@cliender.com", "password": "Master123", "role": "admin"},
    {"name": "Toni", "email": "toni@cliender.com", "password": "Master123", "role": "admin"},
    {"name": "Dan", "email": "dan@cliender.com", "password": "Master123", "role": "admin"},
    {"name": "Ruben", "email": "ruben@cliender.com", "password": "Cliender123", "role": "commercial"},
    {"name": "Ethan", "email": "ethan@cliender.com", "password": "Cliender123", "role": "commercial"},
]

TEST_LEADS = [
    {
        "name": "ConstructHogar Madrid SL",
        "website": "www.constructhogar.es",
        "city": "Madrid",
        "industry": "Reformas y Obras Menores",
        "phone": "+34 612 345 678",
        "digital_score": 45,
        "opportunity_level": "media",
        "redes_sociales": False,
        "captacion_leads": False,
        "email_marketing": False,
        "video_contenido": False,
        "seo_info": False,
        "hooks": ["Recientemente completasteis una reforma en Chamberí — ¿cómo capturáis nuevos clientes después de eso?", "Veo que tenéis buenas reseñas en Google, pero sin presencia en redes. Eso podría estar costándoos un 30% de clientes.", "¿Estáis usando algún sistema para convertir visitas en presupuestos solicitados?"],
        "opening_lines": ["Buenos días, soy [TU NOMBRE] de Cliender. He visto que ConstructHogar tiene buenas reseñas pero prácticamente nada en redes. Creo que podemos ayudaros a captar más clientes desde ahí.", "Hola [NOMBRE], te llamo porque trabajamos con varias reformistas en Madrid y les estamos ayudando a generar presupuestos de forma automática por internet. ¿Ahora es buen momento?", "Buenos días [NOMBRE]. Vi que recibisteis una reforma grande hace poco. La pregunta es: ¿cómo estáis generando el siguiente?"],
        "opportunity_analysis": "Presencia digital débil pero buena reputación local. Oportunidad clara en captura de leads online y automatización de presupuestos."
    },
    {
        "name": "Albañilería García y Hijos",
        "website": "www.albanileriagarcia.com",
        "city": "Barcelona",
        "industry": "Construcción Residencial",
        "phone": "+34 693 456 789",
        "digital_score": 28,
        "opportunity_level": "alta",
        "redes_sociales": False,
        "captacion_leads": False,
        "email_marketing": False,
        "video_contenido": False,
        "seo_info": False,
        "hooks": ["Negocios de construcción en Barcelona con website básico típicamente pierden 40% de oportunidades por falta de presencia digital.", "Detecté que no tenéis email marketing — eso significa que cada cliente que no cierra simplemente desaparece sin seguimiento.", "¿Recibís consultas de clientes potenciales que no sabéis convertir en presupuestos?"],
        "opening_lines": ["Hola [NOMBRE], soy [TU NOMBRE] de Cliender. Trabajamos con albañilerías en Barcelona ayudándoles a captar más clientes y convertirlos en presupuestos. ¿Tienes dos minutos?", "Buenos días [NOMBRE]. Te llamo porque detecté que García y Hijos tiene poco presencia online comparado con vuestros competidores. Creo que tenemos algo que os interesa.", "Hola [NOMBRE], ¿qué estáis haciendo actualmente para generar clientes nuevos cada mes?"],
        "opportunity_analysis": "Muy baja presencia digital (website antiguo, sin redes, sin email). Máxima oportunidad para captura de leads y automatización."
    },
    {
        "name": "Reformas Integral Sevilla",
        "website": None,
        "city": "Sevilla",
        "industry": "Reformas Integrales",
        "phone": "+34 654 789 123",
        "digital_score": 12,
        "opportunity_level": "alta",
        "redes_sociales": False,
        "captacion_leads": False,
        "email_marketing": False,
        "video_contenido": False,
        "seo_info": False,
        "hooks": ["Empresas de reformas sin presencia web pierden el 60% de consultas que vienen de búsquedas locales.", "¿Tenéis un sistema para recoger presupuestos solicitados online o todo es por teléfono?", "La mayoría de empresas como la vuestra captan clientes solo por boca a boca — eso limita mucho el crecimiento."],
        "opening_lines": ["Hola [NOMBRE], soy [TU NOMBRE] de Cliender. Estoy llamando a reformistas en Sevilla que tienen mucho trabajo pero quieren crecer más. ¿Te suena?", "Buenos días [NOMBRE], te llamo porque vimos que Reformas Integral tiene mucho volumen pero sin presencia online. Podemos ayudaros a captar más sin invertir más tiempo de vuestro equipo.", "¿[NOMBRE]? Te llamo de Cliender. Trabajamos con reformistas para automatizar la captación de clientes. ¿Ahora tienes 5 minutos?"],
        "opportunity_analysis": "Sin presencia digital alguna. Enorme potencial de crecimiento mediante captación online y automatización de presupuestos."
    },
    {
        "name": "Construcciones Modernas Valencia",
        "website": "www.construccionesmodernas.es",
        "city": "Valencia",
        "industry": "Obra Nueva y Reformas",
        "phone": "+34 667 890 234",
        "digital_score": 56,
        "opportunity_level": "media",
        "redes_sociales": True,
        "captacion_leads": False,
        "email_marketing": False,
        "video_contenido": False,
        "seo_info": True,
        "hooks": ["Tenéis buen SEO local pero sin sistema de captación de leads — el tráfico no se convierte.", "Veo actividad en redes pero sin estrategia clara de conversión a presupuestos solicitados.", "¿Estáis usando algún CRM o simplemente todo es manual cuando llega una consulta?"],
        "opening_lines": ["Hola [NOMBRE], te llamo de Cliender. He revisado Construcciones Modernas y tenéis buen tráfico pero detecté que se pierde en la conversión. ¿Podemos hablar un segundo?", "Buenos días [NOMBRE]. Trabajamos con constructoras en Valencia que tienen tráfico pero necesitan mejorar la conversión a presupuestos. ¿Encaja con vosotros?", "Hola [NOMBRE], soy [TU NOMBRE]. Vi que recibís bastante tráfico en vuestro web. La pregunta es: ¿cuántos de esos visitantes se convierten en presupuestos solicitados?"],
        "opportunity_analysis": "Presencia digital media. Oportunidad clara en mejora de conversión y automatización de seguimiento de leads."
    },
    {
        "name": "Constructora Andersen SL",
        "website": "www.constructoraandersen.es",
        "city": "Bilbao",
        "industry": "Construcción Industrial",
        "phone": "+34 678 901 345",
        "digital_score": 72,
        "opportunity_level": "baja",
        "redes_sociales": True,
        "captacion_leads": True,
        "email_marketing": True,
        "video_contenido": False,
        "seo_info": True,
        "hooks": ["Tenéis buena presencia digital pero sin contenido en vídeo — eso podría mejorar la credibilidad en 40%.", "Veo que tenéis email marketing. La pregunta: ¿estáis haciendo seguimiento automático de presupuestos sin respuesta?", "¿Habéis considerado producción de vídeo corporativo para mostrar vuestros proyectos?"],
        "opening_lines": ["Hola [NOMBRE], te llamo de Cliender. He analizado Constructora Andersen y os veo con buena base digital. Detecté un gap en vídeo que podrías mejorar fácilmente.", "Buenos días [NOMBRE]. Trabajamos con constructoras como la vuestra que ya tienen digital pero quieren optimizar el ROI. ¿Os interesa una llamada rápida?", "Hola [NOMBRE], soy [TU NOMBRE]. Veo que producís bastante contenido. ¿Habéis considerado añadir vídeo para aumentar la conversión?"],
        "opportunity_analysis": "Presencia digital sólida. Oportunidad menor pero viable en optimización de video marketing y mejora de conversión avanzada."
    },
]


async def initialize_db() -> None:
    """Inicializa la BD con usuarios y leads de prueba."""
    await init_db()

    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA foreign_keys = ON")

        # Inserta usuarios iniciales
        for user in INITIAL_USERS:
            cursor = await conn.execute(
                "SELECT id FROM lu_users WHERE email = ?", (user["email"],)
            )
            if await cursor.fetchone():
                continue

            password_hash = hash_password(user["password"])
            await conn.execute(
                "INSERT INTO lu_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                (user["name"], user["email"], password_hash, user["role"]),
            )
            await conn.commit()

        # Obtén el ID de Nicolas
        cursor = await conn.execute("SELECT id FROM lu_users WHERE email = 'nicolas@cliender.com'")
        user_row = await cursor.fetchone()
        if not user_row:
            return

        nicolas_id = user_row["id"]
        today = str(date.today())

        # Inserta leads de prueba para Nicolas
        for lead in TEST_LEADS:
            # Verifica si ya existe
            cursor = await conn.execute(
                "SELECT id FROM lu_companies WHERE name = ?", (lead["name"],)
            )
            if await cursor.fetchone():
                continue

            # Inserta empresa
            cursor = await conn.execute(
                """INSERT INTO lu_companies (
                    name, website, city, industry, phone, digital_score,
                    opportunity_level, redes_sociales, captacion_leads,
                    email_marketing, video_contenido, seo_info,
                    hooks, opening_lines, opportunity_analysis
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    lead["name"],
                    lead["website"],
                    lead["city"],
                    lead["industry"],
                    lead["phone"],
                    lead["digital_score"],
                    lead["opportunity_level"],
                    lead["redes_sociales"],
                    lead["captacion_leads"],
                    lead["email_marketing"],
                    lead["video_contenido"],
                    lead["seo_info"],
                    json.dumps(lead["hooks"]),
                    json.dumps(lead["opening_lines"]),
                    lead["opportunity_analysis"],
                ),
            )
            company_id = cursor.lastrowid
            await conn.commit()

            # Inserta contacto
            contact_name = lead["name"].split()[0] if lead["name"] else "Contacto"
            await conn.execute(
                "INSERT INTO lu_contacts (company_id, name, title, phone, email) VALUES (?, ?, ?, ?, ?)",
                (company_id, contact_name, "Responsable", lead["phone"], None),
            )
            await conn.commit()

            # Inserta asignación
            await conn.execute(
                "INSERT INTO lu_daily_assignments (company_id, user_id, assigned_date, status) VALUES (?, ?, ?, ?)",
                (company_id, nicolas_id, today, "pending"),
            )
            await conn.commit()


if __name__ == "__main__":
    asyncio.run(initialize_db())
