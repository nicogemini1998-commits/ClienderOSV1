from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
import json
from database import get_conn
from auth import require_admin
from services.excel_reader import parse_excel, parse_csv
from services.import_validator import validate_import
from services.enrichment import enrich_company

router = APIRouter()

class ImportLeadsAssignmentRequest(BaseModel):
  leads: list[dict]
  assignments: list[dict]

@router.post("/upload")
async def upload_excel(file: UploadFile = File(...), _=Depends(require_admin)):
  try:
    content = await file.read()
    is_csv = file.filename.lower().endswith('.csv')
    result = parse_csv(content) if is_csv else parse_excel(content)

    if result.get('error'):
      raise HTTPException(status_code=400, detail=result['error'])

    return {
      'success': True,
      'total': result['total'],
      'headers': result['headers'],
      'columns_found': result['columns_found'],
      'sample_rows': result['rows'][:3],
      'all_rows': result['rows'],
    }
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))

@router.post("/validate")
async def validate_leads(data: dict, _=Depends(require_admin)):
  try:
    columns_found = data.get('columns_found', {})
    rows = data.get('all_rows', [])

    validation = await validate_import(columns_found, rows)
    return {
      'success': True,
      'validation': validation,
    }
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))

@router.post("/assign")
async def assign_leads(request: ImportLeadsAssignmentRequest, _=Depends(require_admin)):
  conn = await get_conn()
  try:
    leads = request.leads
    assignments = request.assignments

    inserted_companies = {}
    inserted_contacts = {}

    for lead in leads:
      company_name = lead.get('company_name')
      if not company_name:
        continue

      website = lead.get('website', '')
      city = lead.get('city', '')
      industry = lead.get('industry', '')
      sub_industry = lead.get('sub_industry', '')
      company_phone = lead.get('company_phone', '')

      industry_combined = f"{industry} - {sub_industry}" if sub_industry else industry

      company_result = await conn.execute("""
        INSERT INTO lu_companies (name, website, city, industry, phone, source)
        VALUES (?, ?, ?, ?, ?, 'excel_import')
        ON CONFLICT DO NOTHING
      """, (company_name, website, city, industry_combined, company_phone))
      await conn.commit()

      company_id_result = await conn.execute(
        "SELECT id FROM lu_companies WHERE name = ? LIMIT 1",
        (company_name,)
      )
      row = await company_id_result.fetchone()
      if row:
        company_id = row[0]
        inserted_companies[company_name] = company_id

        contact_name = lead.get('contact_name')
        if contact_name:
          contact_title = lead.get('contact_title', '')
          contact_email = lead.get('contact_email', '')
          contact_phone = lead.get('contact_phone') or lead.get('contact_mobile') or company_phone or None
          contact_phone2 = lead.get('contact_phone2') or None
          linkedin_url = lead.get('linkedin_url', '')

          contact_result = await conn.execute("""
            INSERT INTO lu_contacts (company_id, name, title, email, phone, phone2, phone_revealed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
          """, (company_id, contact_name, contact_title, contact_email, contact_phone, contact_phone2, True))
          await conn.commit()

          contact_id_result = await conn.execute(
            "SELECT id FROM lu_contacts WHERE company_id = ? AND name = ? LIMIT 1",
            (company_id, contact_name)
          )
          contact_row = await contact_id_result.fetchone()
          if contact_row:
            inserted_contacts[contact_name] = contact_row[0]

    for assignment in assignments:
      user_id = assignment.get('user_id')
      nichos = assignment.get('nichos', [])
      quantity = assignment.get('quantity', 0)

      if not user_id or not nichos or quantity <= 0:
        continue

      assigned_count = 0
      for company_name, company_id in inserted_companies.items():
        if assigned_count >= quantity:
          break

        lead_obj = next((l for l in leads if l.get('company_name') == company_name), None)
        if not lead_obj:
          continue

        industry = lead_obj.get('industry', '').lower()
        sub_industry = lead_obj.get('sub_industry', '').lower()

        match = False
        for nicho in nichos:
          nicho_lower = nicho.lower()
          if nicho_lower in industry or nicho_lower in sub_industry:
            match = True
            break

        if match:
          from datetime import date as _date
          today = str(_date.today())
          assignment_result = await conn.execute("""
            INSERT INTO lu_daily_assignments (company_id, user_id, assigned_date, status)
            VALUES (?, ?, ?, 'pending')
            ON CONFLICT DO NOTHING
          """, (company_id, user_id, today))
          await conn.commit()
          assigned_count += 1

    for company_id in inserted_companies.values():
      try:
        await enrich_company(company_id)
      except Exception:
        pass

    return {
      'success': True,
      'companies_imported': len(inserted_companies),
      'contacts_imported': len(inserted_contacts),
      'assignments_created': sum(len([c for c in inserted_companies.values()]) for _ in [1]),
    }
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))
  finally:
    await conn.close()
