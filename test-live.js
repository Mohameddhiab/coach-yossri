const fetch = globalThis.fetch;

async function run() {
  console.log("=== 1. Testing GET https://coach-yossri.vercel.app/login ===");
  const res = await fetch("https://coach-yossri.vercel.app/login");
  console.log("Status:", res.status);
  const html = await res.text();
  
  // Find JS bundles referenced in HTML
  const scriptMatches = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map(m => m[1]);
  console.log("Found scripts:", scriptMatches);

  let backendUrl = null;
  for (const scriptPath of scriptMatches) {
    const sRes = await fetch("https://coach-yossri.vercel.app" + scriptPath);
    const sText = await sRes.text();
    const renderMatches = sText.match(/https?:\/\/[a-zA-Z0-9-]+\.onrender\.com[a-zA-Z0-9_\-\.\/]*/g);
    if (renderMatches) {
      console.log(`Found backend URL in ${scriptPath}:`, renderMatches);
      backendUrl = renderMatches[0];
    }
    const apiMatches = sText.match(/https?:\/\/[a-zA-Z0-9-_\.:]+\/api/g);
    if (apiMatches) {
      console.log(`Found API candidates in ${scriptPath}:`, apiMatches);
    }
  }

  // Also test possible render backends
  const possibleUrls = [
    backendUrl,
    "https://coach-yossri-backend.onrender.com/api",
    "https://coach-yossri.onrender.com/api",
    "https://sport-backend.onrender.com/api",
    "https://nineawi-backend.onrender.com/api",
    "https://coach-yosri-backend.onrender.com/api",
    "https://yossri-coach-backend.onrender.com/api"
  ].filter(Boolean);

  console.log("\n=== 2. Testing backend health and login endpoints ===");
  for (const url of Array.from(new Set(possibleUrls))) {
    try {
      console.log(`\nTesting ${url}/health ...`);
      const hRes = await fetch(`${url}/health`, { signal: AbortSignal.timeout(6000) });
      console.log(`-> Health status: ${hRes.status}`);
      const hData = await hRes.text();
      console.log(`-> Health body:`, hData);
    } catch (e) {
      console.log(`-> Health failed:`, e.message);
    }

    try {
      console.log(`Testing POST ${url}/auth/login with credentials...`);
      const lRes = await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "yosricoach@gmail.com",
          password: "Yosri@Coach2026!"
        }),
        signal: AbortSignal.timeout(10000)
      });
      console.log(`-> Login status: ${lRes.status}`);
      const lData = await lRes.text();
      console.log(`-> Login response:`, lData);
    } catch (e) {
      console.log(`-> Login failed:`, e.message);
    }
  }
}

run().catch(console.error);
