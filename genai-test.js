const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = path.resolve(__dirname);
const server = spawn('node', ['server.js'], { cwd, stdio: 'ignore', shell: true });

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  await wait(5000);
  const body = {
    prompt: 'According to the applicant data below, what colleges or universities are good places to apply? Provide 15 unique matches: 5 reach, 5 target, and 5 safety schools. Explain why each school is a good fit based on the applicant data.',
    formData: 'Entry 1: Name: Prospie1; Email: superuser@aol.com; GPA: 4.0; SAT-ACT Range: 32 / 1420-1440; Favorite Color: #ff4d4d; Second Favorite Color: #8fd14f; Favorite Weather: 🏖️ Beach and surf; College Region: Alaska-Hawaii-Overseas; Summer Activity: Volunteer, Youth Employment, Travel; Interests: Gates Scholar, Arista, National Honor Society, Math league; Clubs: Outdoors, Fishing, Rock Climbing, Improv/Drama; Notes: scooba diving'
  };

  try {
    const response = await fetch('http://localhost:3000/api/google-genai-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    fs.writeFileSync(path.join(cwd, 'genai-test-result.txt'), text, 'utf8');
    console.log('TEST_COMPLETE');
  } catch (error) {
    fs.writeFileSync(path.join(cwd, 'genai-test-error.txt'), error.toString(), 'utf8');
    console.error('TEST_ERROR');
  } finally {
    server.kill();
  }
}

runTest();
