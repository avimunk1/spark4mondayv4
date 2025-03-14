// Simple script to test Monday.com API
// Run with: node test-monday-api.js YOUR_API_TOKEN

const token = process.argv[2];

if (!token) {
  console.error('Please provide your Monday.com API token as an argument');
  console.error('Example: node test-monday-api.js YOUR_API_TOKEN');
  process.exit(1);
}

async function testMondayApi() {
  try {
    console.log('Testing Monday.com API connection...');
    
    // Simple query to get current user info
    const query = `query { me { name email } }`;
    
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.me) {
      console.log('✅ API connection successful!');
      console.log(`Authenticated as: ${data.data.me.name} (${data.data.me.email})`);
    } else {
      console.log('❌ API connection test failed: No user data returned');
      if (data.errors) {
        console.log('Errors:', data.errors);
      }
    }
  } catch (error) {
    console.error('❌ Error testing Monday.com API:', error);
  }
}

// Test boards query
async function testBoardsQuery() {
  try {
    console.log('\nTesting boards query...');
    
    // Query to get boards
    const query = `query {
      boards(limit: 5) {
        id
        name
      }
    }`;
    
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    
    if (data.data && data.data.boards) {
      console.log('✅ Boards query successful!');
      console.log(`Found ${data.data.boards.length} boards:`);
      data.data.boards.forEach(board => {
        console.log(`- ${board.name} (ID: ${board.id})`);
      });
    } else {
      console.log('❌ Boards query failed');
      console.log('Response data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error querying boards:', error);
  }
}

// Test specific board query
async function testSpecificBoardQuery() {
  try {
    console.log('\nTesting specific board query (1720560983)...');
    
    // Query to get a specific board with a small limit
    const query = `query {
      boards(ids: [1720560983]) {
        name
        items_page(limit: 5) {
          items {
            id
            name
          }
        }
      }
    }`;
    
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    
    if (data.data && data.data.boards && data.data.boards.length > 0) {
      const board = data.data.boards[0];
      console.log('✅ Specific board query successful!');
      console.log(`Board name: ${board.name}`);
      
      if (board.items_page && board.items_page.items) {
        console.log(`Found ${board.items_page.items.length} items`);
        board.items_page.items.forEach(item => {
          console.log(`- ${item.name} (ID: ${item.id})`);
        });
      } else {
        console.log('No items found in board');
      }
    } else {
      console.log('❌ Specific board query failed');
      console.log('Response data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error querying specific board:', error);
  }
}

// Run all tests
async function runTests() {
  await testMondayApi();
  await testBoardsQuery();
  await testSpecificBoardQuery();
}

runTests(); 