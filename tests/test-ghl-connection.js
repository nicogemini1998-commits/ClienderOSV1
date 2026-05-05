import fetch from 'node-fetch';

const PIT = 'pit-16270e1f-a8bd-4bc1-ab36-62654b9ee2a7';
const CLIENTS = [
  'VALERO Y LORENZO ABOGADOS',
  'REFORMALITAS',
  'OPOSITA-XD',
  'EHE - EUROPEAN HIGHER EDUCATION INSTITUTE',
  'INTEGRA TECHNOLOGIES',
  'SAVIA FORMACIÓN',
  'SAFE ABOGADOS',
  'MIRAMAR STAYS',
  'INNOVA HUMANA',
  'GLOBAL HOSPITAL VETERINARIO'
];

async function testGHLConnection() {
  console.log('[GHL TEST] Iniciando test de conexión con PIT...');
  console.log('[GHL TEST] PIT:', PIT.slice(0, 20) + '...');
  console.log('[GHL TEST] Clientes a buscar:', CLIENTS.length);

  try {
    // Test 1: Fetch all contacts
    console.log('\n[GHL TEST] Obteniendo contactos...');
    const resp = await fetch('https://rest.gohighlevel.com/v1/contacts/?limit=100', {
      headers: {
        'Authorization': `Bearer ${PIT}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[GHL TEST] Status:', resp.status);

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[GHL ERROR]', resp.status, err);
      return;
    }

    const data = await resp.json();
    console.log('[GHL TEST] Respuesta recibida');
    console.log('[GHL TEST] Total contactos:', data.contacts?.length || 0);

    if (data.contacts && data.contacts.length > 0) {
      console.log('\n[GHL TEST] Primeros 3 contactos:');
      data.contacts.slice(0, 3).forEach(c => {
        console.log(`  - ${c.contactName || c.firstName} ${c.lastName} (${c.email})`);
      });
    }

    // Test 2: Search for specific clients
    console.log('\n[GHL TEST] Buscando clientes específicos...');
    const found = [];
    const notFound = [];

    if (data.contacts) {
      for (const clientName of CLIENTS) {
        const match = data.contacts.find(c => {
          const fullName = (c.contactName || `${c.firstName} ${c.lastName}`).toLowerCase();
          return fullName.includes(clientName.toLowerCase());
        });

        if (match) {
          found.push({ name: clientName, ghl: match });
          console.log(`  ✅ ${clientName}`);
        } else {
          notFound.push(clientName);
          console.log(`  ❌ ${clientName}`);
        }
      }
    }

    console.log(`\n[GHL TEST] Resultado: ${found.length}/${CLIENTS.length} encontrados`);

    if (found.length > 0) {
      console.log('\n[GHL TEST] Datos de clientes encontrados:');
      found.forEach(f => {
        console.log(`\n${f.name}`);
        console.log(`  ID: ${f.ghl.id}`);
        console.log(`  Email: ${f.ghl.email}`);
        console.log(`  Teléfono: ${f.ghl.phone}`);
        console.log(`  Empresa: ${f.ghl.companyName}`);
        console.log(`  Tags: ${f.ghl.tags?.join(', ') || 'N/A'}`);
      });
    }

    if (notFound.length > 0) {
      console.log(`\n[GHL TEST] No encontrados (${notFound.length}):`);
      notFound.forEach(n => console.log(`  - ${n}`));
    }

  } catch (err) {
    console.error('[GHL ERROR] Excepción:', err.message);
  }
}

testGHLConnection();
