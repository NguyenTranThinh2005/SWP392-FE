const API_BASE_URL = 'http://localhost:5151';

async function main() {
  const email = 'uchiha@gmail.com';
  const password = '987654321';

  console.log('==================================================');
  console.log(`Starting Manuscript & Page Task Verification Test`);
  console.log(`Target API Base: ${API_BASE_URL}`);
  console.log(`Credentials: ${email}`);
  console.log('==================================================\n');

  try {
    // 1. Login
    console.log('Step 1: Logging in...');
    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    const token = loginData?.data?.token || loginData?.token;
    console.log('✔ Authenticated successfully!\n');

    // 2. Fetch User Info
    const profileRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    const userProfile = profileData.data || profileData;
    const userId = userProfile.userId || userProfile.id;

    // 3. Fetch Chapters list
    console.log('Step 2: Fetching chapters in system...');
    const chaptersRes = await fetch(`${API_BASE_URL}/api/chapters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!chaptersRes.ok) {
      throw new Error(`Failed to fetch chapters (${chaptersRes.status})`);
    }

    const chaptersData = await chaptersRes.json();
    const chapters = chaptersData.data || chaptersData || [];
    console.log(`✔ Found ${chapters.length} chapters in database.`);

    if (chapters.length === 0) {
      console.log('\n❌ No chapters found in the database. To test these features, you must first create a chapter on the UI under an Active Series.');
      return;
    }

    // Select the first chapter to test
    const testChapter = chapters[0];
    const chapterId = testChapter.chapterId || testChapter.id;
    console.log(`Using Chapter ID: ${chapterId} ("${testChapter.title || 'Untitled'}", ChNo: ${testChapter.chapterNo || testChapter.number})\n`);

    // 4. Test Manuscript Submission
    console.log('Step 3: Testing Manuscript Submission...');
    const manuscriptPayload = {
      chapterId: chapterId,
      fileUrl: 'https://project.supabase.co/storage/v1/object/public/general/manuscripts/sample-manuscript.zip',
      notes: 'This is a test manuscript submission from automated E2E test.'
    };

    console.log(`Sending POST to /api/manuscripts...`);
    const manuscriptRes = await fetch(`${API_BASE_URL}/api/manuscripts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(manuscriptPayload)
    });

    if (manuscriptRes.status === 201 || manuscriptRes.ok) {
      const mData = await manuscriptRes.json();
      console.log('✔ Manuscript Submission PASSED!');
      console.log(`  - Manuscript ID: ${mData.data?.manuscriptId || mData.manuscriptId || 'Created'}`);
      console.log(`  - Status: ${mData.data?.status || mData.status || 'SUBMITTED'}\n`);
    } else {
      const errTxt = await manuscriptRes.text();
      console.log(`❌ Manuscript Submission FAILED: ${manuscriptRes.status} - ${errTxt}\n`);
    }

    // 5. Fetch Assistants list for assignment
    console.log('Step 4: Fetching assistants for task assignment...');
    const usersRes = await fetch(`${API_BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!usersRes.ok) {
      throw new Error(`Failed to fetch users list (${usersRes.status})`);
    }

    const usersData = await usersRes.json();
    const usersList = usersData.data || usersData || [];
    const assistants = usersList.filter(u => (u.roleName || u.role || '').toLowerCase() === 'assistant');
    console.log(`✔ Found ${assistants.length} assistants in system.`);

    if (assistants.length === 0) {
      console.log('❌ No assistant accounts found. Cannot test task assignment.');
      return;
    }

    const testAssistant = assistants[0];
    const assistantId = testAssistant.userId || testAssistant.id;
    console.log(`Assigning task to Assistant: "${testAssistant.displayName || testAssistant.name}" (ID: ${assistantId})\n`);

    // 6. Test Page Task Creation
    console.log('Step 5: Testing Page Task Creation...');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5); // due in 5 days

    // Generate random page range to avoid overlap conflicts
    const randomStart = Math.floor(Math.random() * 50) + 1;
    const randomEnd = randomStart + 2;

    const taskPayload = {
      chapterId: chapterId,
      assignedToId: assistantId,
      pageStart: randomStart,
      pageEnd: randomEnd,
      taskType: 'Line Art',
      ratePerPage: 15,
      description: 'E2E test page task assignment. Please draw line art for pages.',
      dueDate: dueDate.toISOString()
    };

    console.log(`Sending POST to /api/page-tasks (Pages ${randomStart}-${randomEnd})...`);
    const taskRes = await fetch(`${API_BASE_URL}/api/page-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskPayload)
    });

    if (taskRes.status === 201 || taskRes.ok) {
      const tData = await taskRes.json();
      console.log('✔ Page Task Creation PASSED!');
      console.log(`  - Page Task ID: ${tData.data?.pageTaskId || tData.id || 'Created'}`);
      console.log(`  - Task Type: ${taskPayload.taskType}`);
      console.log(`  - Assigned To: ${testAssistant.displayName || testAssistant.name}\n`);
    } else {
      const errTxt = await taskRes.text();
      console.log(`❌ Page Task Creation FAILED: ${taskRes.status} - ${errTxt}\n`);
    }

    console.log('==================================================');
    console.log('🎉 E2E TEST WORKFLOW COMPLETE!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Test execution failed with error:');
    console.error(error.message);
  }
}

main();
