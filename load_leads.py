import sqlite3
from datetime import date
import json

c = sqlite3.connect('/app/leadup.db')
cursor = c.cursor()

constructoras = [
    ("Reformas Integrales Madrid SL", "+34 91 555 0123", "https://www.reformasintegrales.es", "Madrid", "Construcción", 4.8, 156),
    ("Constructora Barcelona Proyectos", "+34 93 445 0456", "https://www.bcnproyectos.cat", "Barcelona", "Construcción", 4.6, 203),
    ("Empresa Reformas Valencia", "+34 96 334 0789", "https://www.reformasvalencia.com", "Valencia", "Construcción", 4.7, 89),
    ("Constructoras Sevilla Obras", "+34 95 423 0234", "https://www.sevillaobras.es", "Sevilla", "Construcción", 4.5, 142),
    ("Madrid Integrales Reforma", "+34 91 666 1234", "https://www.madridreforma.es", "Madrid", "Construcción", 4.9, 178),
    ("Barcelona Construcciones Premium", "+34 93 556 5678", "https://www.bcnconstruye.es", "Barcelona", "Construcción", 4.7, 215),
    ("Valencia Obras Mayores", "+34 96 445 2345", "https://www.valenciaobras.es", "Valencia", "Construcción", 4.4, 67),
    ("Sevilla Reforma Total", "+34 95 534 6789", "https://www.sevillareforma.es", "Sevilla", "Construcción", 4.6, 124),
    ("Reformas Madrid Centro", "+34 91 777 2468", "https://www.madridcentro.es", "Madrid", "Construcción", 4.8, 192),
    ("Construcciones Barcelona Moderna", "+34 93 667 3579", "https://www.bcnmoderna.cat", "Barcelona", "Construcción", 4.5, 145),
    ("Valencia Construcción Calidad", "+34 96 556 4690", "https://www.vcalidad.es", "Valencia", "Construcción", 4.7, 98),
    ("Sevilla Obras Profesionales", "+34 95 645 7801", "https://www.sevilla-prof.es", "Sevilla", "Construcción", 4.6, 156),
]

abogados = [
    ("Bufete García Mercantil", "+34 91 888 1234", "https://www.garciamercantil.es", "Madrid", "Derecho", 4.9, 287),
    ("Despacho Jurídico Barcelona", "+34 93 778 5678", "https://www.juridicabarcelona.cat", "Barcelona", "Derecho", 4.8, 156),
    ("Abogados Valencia Especializado", "+34 96 667 2345", "https://www.avalespecializado.es", "Valencia", "Derecho", 4.7, 93),
    ("Bufete Sevilla Legal", "+34 95 756 6789", "https://www.sevillalegal.es", "Sevilla", "Derecho", 4.6, 124),
    ("García López Abogados", "+34 91 999 3456", "https://www.garcialopez-abogados.es", "Madrid", "Derecho", 4.8, 201),
    ("Jurídicos Barcelona Asociados", "+34 93 889 7890", "https://www.jbcasociados.cat", "Barcelona", "Derecho", 4.7, 178),
    ("Abogacía Valencia Consultoría", "+34 96 778 1234", "https://www.avalsultoria.es", "Valencia", "Derecho", 4.5, 112),
    ("Despacho Sevilla Corporativo", "+34 95 867 5678", "https://www.sevillacorp.es", "Sevilla", "Derecho", 4.7, 145),
    ("Martínez Fernández Abogados", "+34 91 111 2345", "https://www.mf-abogados.es", "Madrid", "Derecho", 4.9, 268),
    ("Consultores Jurídicos Barcelona", "+34 93 999 6789", "https://www.cjbarcelona.cat", "Barcelona", "Derecho", 4.6, 189),
    ("Valencia Legal Empresarial", "+34 96 889 0123", "https://www.vlempresarial.es", "Valencia", "Derecho", 4.8, 156),
    ("Sevilla Abogados Especialistas", "+34 95 978 4567", "https://www.sevillaesp.es", "Sevilla", "Derecho", 4.7, 167),
]

today = str(date.today())
target_users = [2, 4, 5]

for i, (name, phone, website, city, industry, rating, reviews) in enumerate(constructoras + abogados):
    user_id = target_users[i % 3]
    cursor.execute('''INSERT INTO lu_companies
        (name, phone, website, city, industry, rating, reviews_count,
         digital_score, opportunity_level,
         redes_sociales, captacion_leads, email_marketing,
         video_contenido, seo_info, hooks, opening_lines, opportunity_analysis)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
    (name, phone, website, city, industry, rating, reviews,
     70, "alta", 1, 1, 1, 0, 1,
     json.dumps(["Buena reputación"]),
     json.dumps(["Hola, vi tu empresa..."]),
     "Alta oportunidad"))

    company_id = cursor.lastrowid

    cursor.execute('''INSERT INTO lu_contacts (company_id, name, phone, title, phone_revealed)
    VALUES (?, ?, ?, ?, 1)''',
    (company_id, name.split()[0], phone, "Responsable"))

    cursor.execute('''INSERT OR IGNORE INTO lu_daily_assignments
    (company_id, user_id, assigned_date, status)
    VALUES (?,?,?,?)''',
    (company_id, user_id, today, "pending"))

c.commit()

total = cursor.execute('SELECT COUNT(*) FROM lu_companies WHERE rating IS NOT NULL;').fetchone()[0]
by_user = cursor.execute('SELECT COUNT(*) as count, user_id FROM lu_daily_assignments GROUP BY user_id ORDER BY user_id;').fetchall()

print(f'Cargados {total} leads reales')
for count, uid in by_user:
    names = {2: 'Toni', 4: 'Ruben', 5: 'Ethan'}
    print(f'  {names.get(uid)}: {count} leads')

c.close()
