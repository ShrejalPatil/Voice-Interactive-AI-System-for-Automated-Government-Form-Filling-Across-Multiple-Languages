// src/api/botAPI.js
export async function startConversation(language) {
  const res = await fetch('http://localhost:5000/api/start-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language })
  });
  return res.json();
}

export async function sendConversation(currentStep, response, language, userData) {
  const res = await fetch('http://localhost:5000/api/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_step: currentStep, response, language, user_data: userData })
  });
  return res.json();
}

export async function checkEligibilityAPI(data, language) {
  const res = await fetch('http://localhost:5000/api/check-eligibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      age: data.age || 0,
      income: data.income || 0,
      caste: data.category || data.caste || '',
      language
    })
  });
  return res.json();
}

export async function submitApplicationAPI(schemeName, applicationData) {
  const res = await fetch('http://localhost:5000/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scheme_name: schemeName,
      application_data: applicationData
    })
  });
  return res.json();
}

export async function getSchemeDetails(schemeName, language) {
  const res = await fetch('http://localhost:5000/api/scheme-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheme_name: schemeName, language })
  });
  return res.json();
}
