require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDb } = require('./database');
const { run, queryOne } = require('../utils/db-helper');
const logger = require('../utils/logger');

async function seed() {
  await initDb();
  logger.info('Starting database seed...');

  // ── Categories ─────────────────────────────────────────────
  const categories = [
    { name: 'Laptop', description: 'Portable computers and workstations' },
    { name: 'Desktop', description: 'Desktop computers and all-in-ones' },
    { name: 'Monitor', description: 'Display screens and monitors' },
    { name: 'Keyboard & Mouse', description: 'Input devices' },
    { name: 'Printer', description: 'Printers, scanners, and copiers' },
    { name: 'Network Equipment', description: 'Routers, switches, and cables' },
    { name: 'Mobile Device', description: 'Phones and tablets' },
    { name: 'Office Furniture', description: 'Chairs, desks, and furniture' },
    { name: 'Projector', description: 'Projectors and presentation equipment' },
    { name: 'Other', description: 'Miscellaneous equipment' },
  ];

  const nowStr = new Date().toISOString().replace('T', ' ').split('.')[0];
  for (const cat of categories) {
    run('INSERT INTO asset_categories (name, description, created_at) VALUES (?, ?, ?)', [cat.name, cat.description, nowStr]);
  }

  // ── Users ───────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const empHash   = await bcrypt.hash('Employee@123', 12);

  const users = [
    { name: 'System Admin',    email: 'admin@example.com',    hash: adminHash, role: 'admin',    dept: 'IT' },
    { name: 'Alice Johnson',   email: 'alice@example.com',    hash: empHash,   role: 'employee', dept: 'Engineering' },
    { name: 'Bob Smith',       email: 'bob@example.com',      hash: empHash,   role: 'employee', dept: 'Marketing' },
    { name: 'Carol Williams',  email: 'carol@example.com',    hash: empHash,   role: 'employee', dept: 'HR' },
    { name: 'David Brown',     email: 'david@example.com',    hash: empHash,   role: 'employee', dept: 'Finance' },
    { name: 'Eve Davis',       email: 'eve@example.com',      hash: empHash,   role: 'employee', dept: 'Engineering' },
    { name: 'IT Manager',      email: 'itmanager@example.com',hash: adminHash, role: 'admin',    dept: 'IT' },
  ];

  const phones = ['9876543210','9123456780','9234567891','9345678902','9456789013','9567890124','9678901235'];
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    run('INSERT INTO users (name,email,password_hash,role,department,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
        [u.name, u.email, u.hash, u.role, u.dept, phones[i], nowStr, nowStr]);
  }

  // ── Get IDs ─────────────────────────────────────────────────
  const getUser  = (email) => queryOne('SELECT id FROM users WHERE email = ?', [email])?.id;
  const getCat   = (name)  => queryOne('SELECT id FROM asset_categories WHERE name = ?', [name])?.id;

  const adminId  = getUser('admin@example.com');
  const aliceId  = getUser('alice@example.com');
  const bobId    = getUser('bob@example.com');
  const carolId  = getUser('carol@example.com');
  const davidId  = getUser('david@example.com');
  const eveId    = getUser('eve@example.com');

  const laptopCat   = getCat('Laptop');
  const desktopCat  = getCat('Desktop');
  const monitorCat  = getCat('Monitor');
  const kbmCat      = getCat('Keyboard & Mouse');
  const printerCat  = getCat('Printer');
  const netCat      = getCat('Network Equipment');
  const mobileCat   = getCat('Mobile Device');
  const projCat     = getCat('Projector');
  const otherCat    = getCat('Other');

  // ── Assets ──────────────────────────────────────────────────
  const assets = [
    ['Dell Latitude 5540',  laptopCat,  'DL-001-2024', 'Latitude 5540',  'Dell',     '2024-01-15', 85000, '2027-01-15', 'assigned',    'Office Floor 1', 'Assigned to Alice'],
    ['Dell Latitude 5540',  laptopCat,  'DL-002-2024', 'Latitude 5540',  'Dell',     '2024-01-15', 85000, '2027-01-15', 'assigned',    'Office Floor 2', 'Assigned to Bob'],
    ['MacBook Pro 14"',     laptopCat,  'MB-001-2023', 'MacBook Pro M3', 'Apple',    '2023-06-01', 220000,'2026-06-01', 'available',   'IT Storage',     'Available for senior devs'],
    ['HP EliteDesk 800',    desktopCat, 'HP-D001-2024','EliteDesk 800',  'HP',       '2024-02-20', 65000, '2027-02-20', 'assigned',    'Office Floor 3', 'Carol\'s machine'],
    ['Dell OptiPlex 7090',  desktopCat, 'DO-001-2023', 'OptiPlex 7090',  'Dell',     '2023-09-10', 55000, '2026-09-10', 'available',   'IT Storage',     null],
    ['LG 27" 4K Monitor',   monitorCat, 'LG-M001-2024','27UK850-W',      'LG',       '2024-01-20', 38000, '2027-01-20', 'assigned',    'Office Floor 1', null],
    ['Samsung 24" Monitor', monitorCat, 'SM-M001-2023','LS24A400',       'Samsung',  '2023-08-05', 22000, '2026-08-05', 'available',   'IT Storage',     null],
    ['Logitech MX Keys',    kbmCat,     'LG-K001-2024','MX Keys Combo',  'Logitech', '2024-03-01', 12000, '2026-03-01', 'assigned',    'Office Floor 2', null],
    ['HP LaserJet Pro',     printerCat, 'HP-P001-2023','M404dn',         'HP',       '2023-07-15', 35000, '2026-07-15', 'available',   'Office Floor 1', 'Shared printer'],
    ['Cisco Router',        netCat,     'CS-R001-2023','RV345',          'Cisco',    '2023-01-10', 42000, '2026-01-10', 'maintenance', 'Server Room',    'Firmware update pending'],
    ['iPad Pro 12.9"',      mobileCat,  'AP-I001-2024','iPad Pro M2',    'Apple',    '2024-04-01', 95000, '2027-04-01', 'assigned',    'Marketing Dept', null],
    ['Epson Projector',     projCat,    'EP-P001-2023','EH-TW5825',      'Epson',    '2023-05-20', 55000, '2026-05-20', 'available',   'Conference Room',null],
    ['Dell Latitude 7440',  laptopCat,  'DL-003-2024', 'Latitude 7440',  'Dell',     '2024-05-01', 110000,'2027-05-01', 'assigned',    'Office Floor 1', 'David\'s machine'],
    ['UPS APC 1500VA',      otherCat,   'APC-001-2023','Smart-UPS 1500', 'APC',      '2023-03-15', 28000, '2026-03-15', 'available',   'Server Room',    null],
    ['HP Webcam 960',       otherCat,   'HP-W001-2024','w310 Webcam',    'HP',       '2024-02-01', 4500,  '2026-02-01', 'assigned',    'Office Floor 2', null],
  ];

  for (const a of assets) {
    run(`INSERT INTO assets (name,category_id,serial_number,model,manufacturer,purchase_date,purchase_cost,warranty_expiry,status,location,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [...a, nowStr, nowStr]);
  }

  // ── Assignments ─────────────────────────────────────────────
  const getAsset = (serial) => queryOne('SELECT id FROM assets WHERE serial_number = ?', [serial])?.id;

  const assignments = [
    [getAsset('DL-001-2024'), aliceId,  adminId, '2024-01-20 10:00:00', 'Primary work laptop'],
    [getAsset('DL-002-2024'), bobId,    adminId, '2024-01-20 10:00:00', 'Primary work laptop'],
    [getAsset('HP-D001-2024'), carolId, adminId, '2024-02-25 10:00:00', 'Primary workstation'],
    [getAsset('LG-M001-2024'), aliceId, adminId, '2024-01-20 10:00:00', 'External monitor'],
    [getAsset('LG-K001-2024'), bobId,   adminId, '2024-03-05 10:00:00', 'Keyboard and mouse combo'],
    [getAsset('AP-I001-2024'), bobId,   adminId, '2024-04-05 10:00:00', 'For field presentations'],
    [getAsset('DL-003-2024'), davidId,  adminId, '2024-05-05 10:00:00', 'Primary work laptop'],
    [getAsset('HP-W001-2024'), eveId,   adminId, '2024-02-05 10:00:00', 'For video calls'],
  ];

  for (const [assetId, userId, assignedBy, date, notes] of assignments) {
    if (assetId) {
      run('INSERT INTO asset_assignments (asset_id,user_id,assigned_by,assigned_at,notes) VALUES (?,?,?,?,?)', [assetId, userId, assignedBy, date, notes]);
    }
  }

  // ── Service Requests ────────────────────────────────────────
  const requests = [
    [aliceId,  'asset_request', 'Need a second monitor for dual-screen setup', 'I need a second monitor to improve productivity on development tasks. Currently working with a single screen.', 'high',     'pending',     null, null,    '2024-06-01 09:00:00', '2024-06-01 09:00:00'],
    [bobId,    'maintenance',   'Laptop fan making noise',                       'My Dell Latitude laptop fan has started making loud grinding noises. It gets very hot during video calls.',         'medium',   'in_progress', getAsset('DL-002-2024'), adminId, '2024-06-02 10:30:00', '2024-06-03 11:00:00'],
    [carolId,  'service',       'VPN access for remote work',                    'I need VPN access configured on my workstation to work from home on Fridays.',                                      'medium',   'approved',    null, adminId, '2024-06-03 08:00:00', '2024-06-04 09:00:00'],
    [davidId,  'asset_request', 'Request for wireless mouse',                    'My current wired mouse cable is damaged. I would prefer a wireless mouse for cleaner desk setup.',                  'low',      'completed',   null, adminId, '2024-05-20 14:00:00', '2024-05-22 16:00:00'],
    [eveId,    'maintenance',   'Webcam not detected by system',                 'The HP webcam assigned to me is not being detected by Windows. I have tried reinstalling drivers.',                 'high',     'pending',     getAsset('HP-W001-2024'), null, '2024-06-05 11:00:00', '2024-06-05 11:00:00'],
    [aliceId,  'other',         'Request for ergonomic chair',                   'I have been experiencing back pain due to my current chair. I would like to request an ergonomic office chair.',    'medium',   'pending',     null, null,    '2024-06-06 09:30:00', '2024-06-06 09:30:00'],
    [bobId,    'asset_request', 'Need laptop charger replacement',               'My laptop charger is broken. The cable has frayed and it no longer charges reliably.',                              'critical', 'approved',    null, adminId, '2024-06-06 14:00:00', '2024-06-07 10:00:00'],
    [carolId,  'maintenance',   'Printer paper jam issue',                       'The HP printer on floor 1 is frequently jamming. It jams after every 3-4 prints.',                                 'medium',   'rejected',    getAsset('HP-P001-2023'), null, '2024-05-15 10:00:00', '2024-05-16 11:00:00'],
  ];

  for (const r of requests) {
    run(`INSERT INTO service_requests (user_id,type,title,description,priority,status,asset_id,assigned_to,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, r);
  }

  // ── Comments ────────────────────────────────────────────────
  const getReqId = (title) => queryOne('SELECT id FROM service_requests WHERE title = ?', [title])?.id;

  const maintReqId = getReqId('Laptop fan making noise');
  const vpnReqId   = getReqId('VPN access for remote work');

  if (maintReqId) {
    run('INSERT INTO request_comments (request_id,user_id,comment,created_at) VALUES (?,?,?,?)', [maintReqId, bobId,   'The noise is loudest when the laptop is under heavy load like during video meetings.', '2024-06-02 11:00:00']);
    run('INSERT INTO request_comments (request_id,user_id,comment,created_at) VALUES (?,?,?,?)', [maintReqId, adminId, 'I have picked up the laptop for inspection. Will update you shortly.', '2024-06-03 11:00:00']);
    run('INSERT INTO request_comments (request_id,user_id,comment,created_at) VALUES (?,?,?,?)', [maintReqId, bobId,   'Thank you! Please let me know if you need any additional information.', '2024-06-03 12:00:00']);
  }

  if (vpnReqId) {
    run('INSERT INTO request_comments (request_id,user_id,comment,created_at) VALUES (?,?,?,?)', [vpnReqId, carolId, 'I would need this setup before Friday this week as I am starting remote work then.', '2024-06-03 08:30:00']);
    run('INSERT INTO request_comments (request_id,user_id,comment,created_at) VALUES (?,?,?,?)', [vpnReqId, adminId, 'Approved. I will configure VPN access by Thursday. Please check your email for instructions.', '2024-06-04 09:00:00']);
  }

  // ── Notifications ───────────────────────────────────────────
  const notifs = [
    [aliceId,  'Asset Assigned to You',        'Dell Latitude 5540 (DL-001-2024) has been assigned to you.',          'success', 1, '2024-01-20 10:00:00'],
    [aliceId,  'Asset Assigned to You',        'LG 27" 4K Monitor (LG-M001-2024) has been assigned to you.',          'success', 1, '2024-01-20 10:05:00'],
    [bobId,    'Request In Progress 🔧',        'Your request "Laptop fan making noise" is now being worked on.',       'info',    0, '2024-06-03 11:00:00'],
    [bobId,    'Request Approved ✅',           'Your request "Request for laptop charger replacement" has been approved.','success',0,'2024-06-07 10:00:00'],
    [carolId,  'Request Approved ✅',           'Your request "VPN access for remote work" has been approved.',         'success', 0, '2024-06-04 09:00:00'],
    [carolId,  'Request Rejected ❌',           'Your request "Printer paper jam issue" has been rejected.',            'error',   1, '2024-05-16 11:00:00'],
    [davidId,  'Request Completed ✅',          'Your request "Request for wireless mouse" has been completed.',        'success', 0, '2024-05-22 16:00:00'],
    [adminId,  'New Service Request',           'Alice Johnson submitted a new asset request: "Need a second monitor..."','info',  0, '2024-06-01 09:00:00'],
    [adminId,  'New Service Request',           'Eve Davis submitted a new maintenance request: "Webcam not detected..."','info',  0, '2024-06-05 11:00:00'],
  ];

  for (const n of notifs) {
    run('INSERT INTO notifications (user_id,title,message,type,is_read,created_at) VALUES (?,?,?,?,?,?)', n);
  }

  // ── Audit Logs ──────────────────────────────────────────────
  run('INSERT INTO audit_logs (user_id,action,entity_type,entity_id,ip_address,created_at) VALUES (?,?,?,?,?,?)', [adminId, 'LOGIN',  'user',  adminId, '127.0.0.1', '2024-06-01 08:00:00']);
  run('INSERT INTO audit_logs (user_id,action,entity_type,entity_id,ip_address,created_at) VALUES (?,?,?,?,?,?)', [adminId, 'CREATE', 'asset', 1,       '127.0.0.1', '2024-01-15 10:00:00']);
  run('INSERT INTO audit_logs (user_id,action,entity_type,entity_id,ip_address,created_at) VALUES (?,?,?,?,?,?)', [adminId, 'ASSIGN', 'asset', 1,       '127.0.0.1', '2024-01-20 10:00:00']);

  logger.info('✅ Database seeded successfully!');
  logger.info('');
  logger.info('  Demo Credentials:');
  logger.info('  Admin:    admin@example.com / Admin@123');
  logger.info('  Employee: alice@example.com  / Employee@123');
  logger.info('  Employee: bob@example.com    / Employee@123');
}

module.exports = seed;
