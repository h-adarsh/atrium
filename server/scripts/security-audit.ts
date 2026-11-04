import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.API_URL || 'http://localhost:5001/api/v1';

async function runSecurityAudit() {
  console.log('🔒 Starting Automated Security Audit & Verification...\n');

  try {
    await fetch('http://localhost:5001/api/health');
  } catch {
    await import('../src/server');
    await new Promise(r => setTimeout(r, 800));
  }

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Fetch test tokens
  // Royal Orchid Admin: admin@atrium.local / admin123
  const roLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@atrium.local', password: 'admin123' })
  });
  const roLogin = await roLoginRes.json();
  const roToken = roLogin.token;

  // Greenwoods Admin: greenwoods.admin@atrium.local / admin123
  const gwLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'greenwoods.admin@atrium.local', password: 'admin123' })
  });
  const gwLogin = await gwLoginRes.json();
  const gwToken = gwLogin.token;

  // Get sample data IDs
  const roSociety = await prisma.society.findUnique({ where: { slug: 'royal-orchid' } });
  const gwSociety = await prisma.society.findUnique({ where: { slug: 'greenwoods' } });

  const roExpense = await prisma.expense.findFirst({ where: { societyId: roSociety!.id } });
  const roNotice = await prisma.notice.findFirst({ where: { societyId: roSociety!.id } });
  const roComplaint = await prisma.complaint.findFirst({ where: { societyId: roSociety!.id } });
  const roPayment = await prisma.payment.findFirst({
    where: { due: { societyId: roSociety!.id } },
    include: { due: true }
  });
  const roFlat = await prisma.flat.findFirst({ where: { societyId: roSociety!.id } });

  console.log('--- TEST GROUP 1: Multi-Tenant Cross-Society IDOR Protection ---');

  // Test 1.1: Greenwoods Admin trying to delete a Royal Orchid Expense
  if (roExpense) {
    const res = await fetch(`${BASE_URL}/finance/expenses/${roExpense.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${gwToken}` }
    });
    assert(res.status === 403, 'Cross-tenant expense deletion blocked with 403 Forbidden');
  }

  // Test 1.2: Greenwoods Admin trying to verify a Royal Orchid Payment
  if (roPayment) {
    const res = await fetch(`${BASE_URL}/finance/payments/${roPayment.id}/verify`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${gwToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'VERIFIED' })
    });
    assert(res.status === 403, 'Cross-tenant payment verification blocked with 403 Forbidden');
  }

  // Test 1.3: Greenwoods Admin trying to update a Royal Orchid Flat
  if (roFlat) {
    const res = await fetch(`${BASE_URL}/flats/${roFlat.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${gwToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ superBuiltUpSqFt: 9999 })
    });
    assert(res.status === 403, 'Cross-tenant flat modification blocked with 403 Forbidden');
  }

  // Test 1.4: Greenwoods Admin trying to toggle-pin a Royal Orchid Notice
  if (roNotice) {
    const res = await fetch(`${BASE_URL}/notices/${roNotice.id}/toggle-pin`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${gwToken}` }
    });
    assert(res.status === 403, 'Cross-tenant notice pin tampering blocked with 403 Forbidden');
  }

  // Test 1.5: Greenwoods Admin trying to delete a Royal Orchid Notice
  if (roNotice) {
    const res = await fetch(`${BASE_URL}/notices/${roNotice.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${gwToken}` }
    });
    assert(res.status === 403, 'Cross-tenant notice deletion blocked with 403 Forbidden');
  }

  // Test 1.6: Greenwoods Admin trying to update a Royal Orchid Complaint
  if (roComplaint) {
    const res = await fetch(`${BASE_URL}/complaints/${roComplaint.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${gwToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Hacked' })
    });
    assert(res.status === 403, 'Cross-tenant complaint resolution blocked with 403 Forbidden');
  }

  console.log('\n--- TEST GROUP 2: Unapproved Resident Security Gate ---');
  // Create a temporary PENDING resident
  const tempEmail = `pending.tester.${Date.now()}@atrium.local`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Pending Tester',
      email: tempEmail,
      phone: '+91 99999 88888',
      unitNumber: roFlat!.unitNumber,
      societySlug: 'royal-orchid',
      password: 'password123',
      passwordConfirmation: 'password123',
      occupancyType: 'TENANT'
    })
  });
  const regData = await regRes.json();
  const pendingToken = regData.token;

  // Unapproved resident attempting to read finance ledger
  const duesRes = await fetch(`${BASE_URL}/finance/dues`, {
    headers: { Authorization: `Bearer ${pendingToken}` }
  });
  const duesData = await duesRes.json();
  assert(
    duesRes.status === 403 && duesData.code === 'ACCOUNT_PENDING_APPROVAL',
    'Pending resident denied private finance dues ledger (403 ACCOUNT_PENDING_APPROVAL)'
  );

  // Unapproved resident attempting to read complaints
  const compRes = await fetch(`${BASE_URL}/complaints`, {
    headers: { Authorization: `Bearer ${pendingToken}` }
  });
  assert(compRes.status === 403, 'Pending resident denied complaints access (403)');

  console.log('\n--- TEST GROUP 3: Registration Review Security & PII Protection ---');
  // Greenwoods Admin trying to approve this Royal Orchid pending resident
  const crossApproveRes = await fetch(`${BASE_URL}/auth/admin/registrations/${regData.user.id}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${gwToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'APPROVE' })
  });
  assert(crossApproveRes.status === 403, 'Cross-tenant resident registration review blocked (403)');

  // Royal Orchid Admin approving legitimate registration
  const legitimateApproveRes = await fetch(`${BASE_URL}/auth/admin/registrations/${regData.user.id}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${roToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'APPROVE' })
  });
  const legitData = await legitimateApproveRes.json();
  assert(legitimateApproveRes.status === 200, 'Legitimate same-society approval succeeds');
  assert(!('passwordHash' in (legitData.user || {})), 'No passwordHash leakage in registration review response');

  // Clean up test user
  await prisma.user.delete({ where: { id: regData.user.id } });

  console.log('\n--- TEST GROUP 4: Resource Exhaustion & DoS Input Boundaries ---');
  const dosRes = await fetch(`${BASE_URL}/societies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Malicious DoS Tower',
      totalFloors: 9999,
      flatsPerFloor: 500
    })
  });
  assert(dosRes.status === 400, 'Extreme floors/units input rejected with 400 Bad Request');

  console.log('\n--- TEST GROUP 5: Path Traversal Protection on Receipts ---');
  const pathTravRes = await fetch(`${BASE_URL}/finance/receipts/../../etc/passwd`, {
    headers: { Authorization: `Bearer ${roToken}` }
  });
  assert(pathTravRes.status === 400 || pathTravRes.status === 404, 'Path traversal receipt request rejected safely');

  console.log('\n--- TEST GROUP 6: Production Storage & Data Exposure Controls ---');
  // Direct access to /uploads/receipts is forbidden
  const directReceiptRes = await fetch('http://localhost:5001/uploads/receipts/receipt-RCP-202610-101.pdf');
  assert(directReceiptRes.status === 403, 'Direct access to /uploads/receipts blocked with 403 Forbidden');

  // Unauthenticated access to /uploads requires login
  const unauthUploadRes = await fetch('http://localhost:5001/uploads/any-proof-file.jpg');
  assert(unauthUploadRes.status === 401, 'Unauthenticated /uploads access blocked with 401 Unauthorized');

  // Public /societies/:slug masks bank account details
  const publicSocietyRes = await fetch(`${BASE_URL}/societies/royal-orchid`);
  const publicSociety = await publicSocietyRes.json();
  const bankAcc = publicSociety.society?.config?.bankAccountNumber || '';
  assert(bankAcc.includes('••••') || !bankAcc, 'Public society endpoint masks bank account number');

  console.log('\n=============================================');
  console.log(`AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runSecurityAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

