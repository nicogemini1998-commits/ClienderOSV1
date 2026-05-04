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

async function testGHL(method, url, headers, body = null) {
  try {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const resp = await fetch(url, opts);
    const text = await resp.text();

    try {
      const data = JSON.parse(text);
      return { status: resp.status, data };
    } catch {
      return { status: resp.status, data: text };
    }
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('🔍 Testing GHL Private Integration (PIT)');
  console.log('PIT:', PIT);
  console.log('');

  // Test 1: Bearer token en header Authorization
  console.log('Test 1: Bearer token');
  let res = await testGHL('GET', 'https://rest.gohighlevel.com/v1/contacts/?limit=10', {
    'Authorization': `Bearer ${PIT}`,
    'Content-Type': 'application/json'
  });
  console.log(`  Status: ${res.status}, Data:`, res.data?.msg || res.data?.contacts?.length || res.error);

  // Test 2: Sin Bearer
  console.log('\nTest 2: Token directo (sin Bearer)');
  res = await testGHL('GET', 'https://rest.gohighlevel.com/v1/contacts/?limit=10', {
    'Authorization': PIT,
    'Content-Type': 'application/json'
  });
  console.log(`  Status: ${res.status}, Data:`, res.data?.msg || res.data?.contacts?.length || res.error);

  // Test 3: Como header custom
  console.log('\nTest 3: Header custom');
  res = await testGHL('GET', 'https://rest.gohighlevel.com/v1/contacts/?limit=10', {
    'X-Integration-Token': PIT,
    'Content-Type': 'application/json'
  });
  console.log(`  Status: ${res.status}, Data:`, res.data?.msg || res.data?.contacts?.length || res.error);

  // Test 4: En query param
  console.log('\nTest 4: Query param');
  res = await testGHL('GET', `https://rest.gohighlevel.com/v1/contacts/?limit=10&token=${PIT}`, {
    'Content-Type': 'application/json'
  });
  console.log(`  Status: ${res.status}, Data:`, res.data?.msg || res.data?.contacts?.length || res.error);

  // Test 5: Endpoint /me para verificar integración
  console.log('\nTest 5: Verificar integración (GET /v1/me)');
  res = await testGHL('GET', 'https://rest.gohighlevel.com/v1/me', {
    'Authorization': `Bearer ${PIT}`,
    'Content-Type': 'application/json'
  });
  console.log(`  Status: ${res.status}, Data:`, res.data?.id || res.data?.msg || res.error);

  // Test 6: Listar locations
  console.log('\nTest 6: Listar ubicaciones (GET /v1/locations)');
  res = await testGHL('GET', 'https://rest.gohighlevel.com/v1/locations', {
    'Authorization': `Bearer ${PIT}`,
    'Content-Type': 'application/json'
  });
  console.log(`  Status: ${res.status}, Data:`, res.data?.locations?.length || res.data?.msg || res.error);

  console.log('\n✅ Tests completados - verificar resultados arriba');
}

main();
