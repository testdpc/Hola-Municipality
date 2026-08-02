const base = process.env.API_BASE || 'http://127.0.0.1:23569/api';

async function request(path, opts = {}){
  const url = `${base}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try{ body = JSON.parse(text); }catch{ body = text; }
  return { status: res.status, body };
}

async function login(){
  return request('/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin1234' }) });
}

async function run(){
  console.log('Logging in...');
  const loginRes = await login();
  console.log('Login:', loginRes.status);
  if(loginRes.status !== 200){ console.error('Login failed:', loginRes.body); process.exit(1); }
  const token = loginRes.body.token;
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Departments CRUD
  console.log('Testing Departments CRUD...');
  const deps = await request('/departments', { headers: auth });
  console.log('GET /departments ->', deps.status, Array.isArray(deps.body) ? deps.body.length : deps.body);

  const createDep = await request('/departments', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'TestDeptX', description: 'Created by test' }) });
  console.log('POST /departments ->', createDep.status, createDep.body);
  const depId = createDep.body && createDep.body.id;

  const getDep = await request(`/departments/${depId}`, { headers: auth });
  console.log('GET /departments/:id ->', getDep.status, getDep.body);

  const patchDep = await request(`/departments/${depId}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ name: 'TestDeptXUpdated' }) });
  console.log('PATCH /departments/:id ->', patchDep.status, patchDep.body);

  const delDep = await request(`/departments/${depId}`, { method: 'DELETE', headers: auth });
  console.log('DELETE /departments/:id ->', delDep.status, delDep.body);

  // Categories CRUD
  console.log('Testing Categories CRUD...');
  const cats = await request('/categories', { headers: auth });
  console.log('GET /categories ->', cats.status, Array.isArray(cats.body) ? cats.body.length : cats.body);

  const createCat = await request('/categories', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'TestCatX', description: 'Created by test' }) });
  console.log('POST /categories ->', createCat.status, createCat.body);
  const catId = createCat.body && createCat.body.id;

  const getCat = await request(`/categories/${catId}`, { headers: auth });
  console.log('GET /categories/:id ->', getCat.status, getCat.body);

  const patchCat = await request(`/categories/${catId}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ name: 'TestCatXUpdated' }) });
  console.log('PATCH /categories/:id ->', patchCat.status, patchCat.body);

  const delCat = await request(`/categories/${catId}`, { method: 'DELETE', headers: auth });
  console.log('DELETE /categories/:id ->', delCat.status, delCat.body);

  // Units CRUD
  console.log('Testing Units CRUD...');
  const units = await request('/units', { headers: auth });
  console.log('GET /units ->', units.status, Array.isArray(units.body) ? units.body.length : units.body);

  const createUnit = await request('/units', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'TestUnitX', abbreviation: 'tx', description: 'Created by test' }) });
  console.log('POST /units ->', createUnit.status, createUnit.body);
  const unitId = createUnit.body && createUnit.body.id;

  const getUnit = await request(`/units/${unitId}`, { headers: auth });
  console.log('GET /units/:id ->', getUnit.status, getUnit.body);

  const patchUnit = await request(`/units/${unitId}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ name: 'TestUnitXUpdated' }) });
  console.log('PATCH /units/:id ->', patchUnit.status, patchUnit.body);

  const delUnit = await request(`/units/${unitId}`, { method: 'DELETE', headers: auth });
  console.log('DELETE /units/:id ->', delUnit.status, delUnit.body);

  // Stores CRUD
  console.log('Testing Stores CRUD...');
  const stores = await request('/stores', { headers: auth });
  console.log('GET /stores ->', stores.status, Array.isArray(stores.body) ? stores.body.length : stores.body);

  const createStore = await request('/stores', { method: 'POST', headers: auth, body: JSON.stringify({ storeCode: 'TST1', name: 'Test Store 1', location: 'Test', description: 'Created by test' }) });
  console.log('POST /stores ->', createStore.status, createStore.body);
  const storeId = createStore.body && createStore.body.id;

  const getStore = await request(`/stores/${storeId}`, { headers: auth });
  console.log('GET /stores/:id ->', getStore.status, getStore.body);

  const patchStore = await request(`/stores/${storeId}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ name: 'Test Store 1 Updated' }) });
  console.log('PATCH /stores/:id ->', patchStore.status, patchStore.body);

  const delStore = await request(`/stores/${storeId}`, { method: 'DELETE', headers: auth });
  console.log('DELETE /stores/:id ->', delStore.status, delStore.body);

  console.log('CRUD tests complete.');
}

run().catch(e=>{ console.error(e); process.exit(1); });
