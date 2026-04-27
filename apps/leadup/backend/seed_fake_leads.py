"""
Inserta 10 leads ficticios para hoy en la base de datos.
Asignados al usuario 1 (Nicolas). Ejecutar: python seed_fake_leads.py
"""
import asyncio, json, sys, os
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
from database import DB_PATH, init_db
import aiosqlite

COMPANIES = [
    {
        "name": "Reformas Madrid Centro S.L.",
        "website": "reformasmadridcentro.es",
        "city": "Madrid",
        "industry": "Reformas del hogar",
        "phone": "+34 912 345 678",
        "digital_score": 28,
        "opportunity_level": "alta",
        "redes_sociales": 0,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 0,
        "hooks": json.dumps(["Sin presencia digital — terreno virgen para campaña completa", "Solo 12 reseñas en Google Maps con 3.8★"]),
        "opening_lines": json.dumps(["Buenos días, he visto que llevan varios años en el sector pero no aparecen en Google cuando busco reformas en Madrid — ¿han pensado en cambiarlo?", "Vi su trabajo en Instagram y me parece que podrían captar muchísimo más con la web adecuada."]),
        "opportunity_analysis": "Empresa consolidada sin presencia digital — máxima oportunidad de entrada",
        "contact": {"name": "Carlos Jiménez Ruiz", "title": "Gerente", "phone": "+34 611 234 567", "email": "carlos@reformasmadridcentro.es"},
    },
    {
        "name": "Constructora Hernández e Hijos",
        "website": "constructorahernandez.com",
        "city": "Valencia",
        "industry": "Construcción",
        "phone": "+34 963 210 876",
        "digital_score": 45,
        "opportunity_level": "media",
        "redes_sociales": 1,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 1,
        "hooks": json.dumps(["Tienen web pero sin formulario de contacto ni captación", "Instagram activo pero sin estrategia de contenido"]),
        "opening_lines": json.dumps(["Buenos días, he visto su web y trabajan proyectos muy interesantes — ¿están captando leads online actualmente?", "Vi que tienen redes activas pero podrían convertir mucho más tráfico en clientes."]),
        "opportunity_analysis": "Presencia básica — falta captación y CRM",
        "contact": {"name": "Miguel Hernández López", "title": "Director Comercial", "phone": "+34 622 345 678", "email": "miguel@constructorahernandez.com"},
    },
    {
        "name": "Acabados Premium BCN",
        "website": "acabadospremiumbcn.es",
        "city": "Barcelona",
        "industry": "Acabados y pintura",
        "phone": "+34 932 100 200",
        "digital_score": 61,
        "opportunity_level": "media",
        "redes_sociales": 1,
        "captacion_leads": 1,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 1,
        "hooks": json.dumps(["Sin email marketing — clientes que no se recontactan", "Sin vídeo — sector muy visual donde el vídeo convierte ×3"]),
        "opening_lines": json.dumps(["Hola, he visto su portfolio online y tienen un trabajo excelente — ¿usan email para fidelizar clientes?", "Vi que captan leads pero ¿los nutren con contenido o solo esperan que vuelvan?"]),
        "opportunity_analysis": "Base digital sólida — oportunidad en vídeo y email marketing",
        "contact": {"name": "Anna Puig Ferrer", "title": "Socia directora", "phone": "+34 633 456 789", "email": "anna@acabadospremiumbcn.es"},
    },
    {
        "name": "Obra Nueva Sevilla 2000",
        "website": "",
        "city": "Sevilla",
        "industry": "Construcción residencial",
        "phone": "+34 954 300 400",
        "digital_score": 12,
        "opportunity_level": "alta",
        "redes_sociales": 0,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 0,
        "hooks": json.dumps(["Sin web, sin redes — invisible en digital", "Llevan 20 años en el sector sin presencia online"]),
        "opening_lines": json.dumps(["Buenos días, busqué su empresa en Google y no aparece ninguna web — ¿trabajan solo por recomendación actualmente?", "Me han hablado muy bien de su trabajo, pero sería mucho más fácil que los clientes los encontraran si tuvieran presencia digital."]),
        "opportunity_analysis": "Sin presencia digital absoluta — caso de alto impacto",
        "contact": {"name": "Antonio Morales Vega", "title": "Propietario", "phone": "+34 644 567 890", "email": ""},
    },
    {
        "name": "Grupo Reformas Bilbao",
        "website": "gruporeformasbilbao.com",
        "city": "Bilbao",
        "industry": "Reformas integrales",
        "phone": "+34 944 500 600",
        "digital_score": 73,
        "opportunity_level": "baja",
        "redes_sociales": 1,
        "captacion_leads": 1,
        "email_marketing": 1,
        "video_contenido": 1,
        "seo_info": 1,
        "hooks": json.dumps(["Digitalmente activos — oportunidad en IA y automatización avanzada", "CRM básico — podrían escalar con automatización inteligente"]),
        "opening_lines": json.dumps(["Buenos días, veo que tienen una presencia digital muy sólida — ¿han pensado en integrar IA para cualificar leads automáticamente?", "Su estrategia digital es de las mejores que he visto en el sector — ¿usan analytics para optimizar campañas?"]),
        "opportunity_analysis": "Alto nivel digital — oportunidad solo en servicios avanzados",
        "contact": {"name": "Iker Gaztañaga Urresti", "title": "CEO", "phone": "+34 655 678 901", "email": "iker@gruporeformasbilbao.com"},
    },
    {
        "name": "Construcciones Aragón Norte",
        "website": "construccionesaragonnorte.es",
        "city": "Zaragoza",
        "industry": "Construcción industrial",
        "phone": "+34 976 400 500",
        "digital_score": 34,
        "opportunity_level": "alta",
        "redes_sociales": 0,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 1,
        "hooks": json.dumps(["Web desactualizada de 2015 — no es mobile friendly", "Sin redes sociales — sector industrial donde LinkedIn es clave"]),
        "opening_lines": json.dumps(["Hola, vi su web y tienen proyectos industriales muy potentes — ¿saben que Google ya no les posiciona bien con esa versión web?", "He visto que no están en LinkedIn — en construcción industrial ese canal es donde están sus clientes."]),
        "opportunity_analysis": "Web obsoleta + sin redes — paquete completo de modernización",
        "contact": {"name": "Fernando Lázaro Ibáñez", "title": "Director Técnico", "phone": "+34 666 789 012", "email": "flazaro@construccionesaragonnorte.es"},
    },
    {
        "name": "Diseño Interior Málaga Studio",
        "website": "disenointeriormalaga.com",
        "city": "Málaga",
        "industry": "Diseño de interiores",
        "phone": "+34 952 200 300",
        "digital_score": 55,
        "opportunity_level": "media",
        "redes_sociales": 1,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 1,
        "seo_info": 0,
        "hooks": json.dumps(["Vídeos en Instagram con +50k vistas pero sin sistema de captación", "Sin posicionamiento SEO — pierden tráfico orgánico masivo"]),
        "opening_lines": json.dumps(["He visto sus vídeos de proyectos en Instagram, tienen un ojo increíble — ¿están convirtiendo ese alcance en clientes?", "Con el contenido que generan podrían estar llenando agenda — ¿tienen sistema para captar esos leads?"]),
        "opportunity_analysis": "Buen contenido visual — falta conversión y captación",
        "contact": {"name": "Lucía Fernández Ramos", "title": "Fundadora & Diseñadora", "phone": "+34 677 890 123", "email": "lucia@disenointeriormalaga.com"},
    },
    {
        "name": "Alicante Reformas & Obra",
        "website": "alicantereformas.es",
        "city": "Alicante",
        "industry": "Reformas y construcción",
        "phone": "+34 965 100 200",
        "digital_score": 19,
        "opportunity_level": "alta",
        "redes_sociales": 0,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 0,
        "hooks": json.dumps(["Web existe pero sin SSL — Google la marca como insegura", "4 reseñas en Google — cliente potencial no confía"]),
        "opening_lines": json.dumps(["Hola, vi que tienen web pero aparece como 'no segura' en Chrome — eso les está costando clientes todos los días.", "Con solo 4 reseñas en Google muchos clientes no se fían — ¿han trabajado la reputación online?"]),
        "opportunity_analysis": "Web insegura + reputación mínima — entrada técnica sencilla",
        "contact": {"name": "Raúl Martínez Soler", "title": "Gerente", "phone": "+34 688 901 234", "email": "raul@alicantereformas.es"},
    },
    {
        "name": "Pavimentos y Suelos García",
        "website": "pavimentosgarcia.com",
        "city": "Madrid",
        "industry": "Pavimentos y revestimientos",
        "phone": "+34 914 600 700",
        "digital_score": 42,
        "opportunity_level": "media",
        "redes_sociales": 1,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 1,
        "hooks": json.dumps(["Pinterest con 800 seguidores pero sin conversión web", "Sin catálogo digital — clientes piden fotos por WhatsApp"]),
        "opening_lines": json.dumps(["He visto sus proyectos de suelos en Pinterest, son espectaculares — ¿los clientes les llegan desde ahí o solo por recomendación?", "Con la variedad de suelos que trabajan, un catálogo digital interactivo les cambiaría las ventas — ¿lo han planteado?"]),
        "opportunity_analysis": "Buen producto — falta digitalizar el proceso de venta",
        "contact": {"name": "Rosa García Blanco", "title": "Responsable Comercial", "phone": "+34 699 012 345", "email": "rosa@pavimentosgarcia.com"},
    },
    {
        "name": "Cubiertas y Tejados Valencia",
        "website": "cubiertasvalencia.es",
        "city": "Valencia",
        "industry": "Cubiertas y tejados",
        "phone": "+34 961 300 400",
        "digital_score": 31,
        "opportunity_level": "alta",
        "redes_sociales": 0,
        "captacion_leads": 0,
        "email_marketing": 0,
        "video_contenido": 0,
        "seo_info": 1,
        "hooks": json.dumps(["Aparecen en Google pero web de 2018 sin móvil", "Sector estacional — email marketing les daría flujo todo el año"]),
        "opening_lines": json.dumps(["Buenos días, les encuentro en Google pero su web no se ve bien en el móvil — en 2025 el 80% de búsquedas son desde el teléfono.", "Trabajando cubiertas, los clientes buscan urgente cuando llueve — ¿tienen sistema para capturar esas búsquedas en tiempo real?"]),
        "opportunity_analysis": "SEO básico pero web obsoleta — renovación + captación urgente",
        "contact": {"name": "Javier Torrent Climent", "title": "Jefe de obra y comercial", "phone": "+34 600 123 456", "email": "jtorrent@cubiertasvalencia.es"},
    },
]

async def main():
    await init_db()
    today = str(date.today())

    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row

        # Get user 1 (Nicolas)
        cur = await conn.execute("SELECT id FROM lu_users WHERE id = 1")
        user = await cur.fetchone()
        if not user:
            print("ERROR: Usuario ID 1 no encontrado. Ejecuta create_users.py primero.")
            return

        inserted = 0
        for c in COMPANIES:
            contact_data = c.pop("contact")

            # Upsert company
            cur = await conn.execute("SELECT id FROM lu_companies WHERE name = ?", (c["name"],))
            existing = await cur.fetchone()
            if existing:
                company_id = existing["id"]
            else:
                cur = await conn.execute(
                    """INSERT INTO lu_companies
                       (name, website, city, industry, phone, digital_score, opportunity_level,
                        redes_sociales, captacion_leads, email_marketing, video_contenido, seo_info,
                        hooks, opening_lines, opportunity_analysis)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (c["name"], c["website"], c["city"], c["industry"], c["phone"],
                     c["digital_score"], c["opportunity_level"],
                     c["redes_sociales"], c["captacion_leads"], c["email_marketing"],
                     c["video_contenido"], c["seo_info"],
                     c["hooks"], c["opening_lines"], c["opportunity_analysis"]),
                )
                company_id = cur.lastrowid

            # Upsert contact
            cur = await conn.execute("SELECT id FROM lu_contacts WHERE company_id = ?", (company_id,))
            if not await cur.fetchone():
                await conn.execute(
                    "INSERT INTO lu_contacts (company_id, name, title, phone, email) VALUES (?,?,?,?,?)",
                    (company_id, contact_data["name"], contact_data["title"],
                     contact_data["phone"], contact_data["email"]),
                )

            # Upsert assignment for today
            cur = await conn.execute(
                "SELECT id FROM lu_daily_assignments WHERE company_id = ? AND user_id = ?",
                (company_id, 1),
            )
            if not await cur.fetchone():
                await conn.execute(
                    """INSERT INTO lu_daily_assignments (company_id, user_id, assigned_date, status)
                       VALUES (?, 1, ?, 'pending')""",
                    (company_id, today),
                )
                inserted += 1
            else:
                # Update date to today so it shows up
                await conn.execute(
                    "UPDATE lu_daily_assignments SET assigned_date = ? WHERE company_id = ? AND user_id = 1",
                    (today, company_id),
                )
                inserted += 1

        await conn.commit()
        print(f"✓ {inserted} leads ficticios insertados/actualizados para hoy ({today}), usuario Nicolas (ID 1)")

if __name__ == "__main__":
    asyncio.run(main())
