const fetch = globalThis.fetch;

const FRONTEND_URL = "https://coach-yossri.vercel.app";
const BACKEND_URL = "https://coach-yossri.onrender.com/api";

const CREDENTIALS = {
  email: "yosricoach@gmail.com",
  password: "Yosri@Coach2026!"
};

async function testAll() {
  const results = {
    auth: null,
    backendEndpoints: [],
    frontendPages: [],
    errors: []
  };

  console.log("==================================================");
  console.log("  TESTING COACH YOSSRI PLATFORM (LIVE PRODUCTION)");
  console.log("==================================================");

  // 1. Authenticate against Backend
  console.log("\n[1] Testing Authentication...");
  let token = "";
  let user = null;
  let cookieHeader = "";

  try {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CREDENTIALS)
    });

    const loginData = await loginRes.json();
    const rawCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie")].filter(Boolean);
    cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');

    if (loginRes.status === 201 || loginRes.status === 200) {
      token = loginData.access_token;
      user = loginData.user;
      results.auth = { success: true, status: loginRes.status, user };
      console.log(`✅ Login Successful! User: ${user.prenom} ${user.nom} (${user.email}) - Role: ${user.role}`);
    } else {
      results.auth = { success: false, status: loginRes.status, data: loginData };
      results.errors.push({ type: "AUTH_FAILED", details: loginData });
      console.error(`❌ Login failed:`, loginData);
      return results;
    }
  } catch (err) {
    results.auth = { success: false, error: err.message };
    results.errors.push({ type: "AUTH_EXCEPTION", message: err.message });
    console.error(`❌ Login exception:`, err.message);
    return results;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "Cookie": cookieHeader || `9awi_access=${token}`
  };

  // 2. Test Backend Endpoints for Coach
  console.log("\n[2] Testing Coach Backend Endpoints...");
  const endpointsToTest = [
    { method: "GET", path: "/auth/me", label: "Get Profile (/auth/me)" },
    { method: "GET", path: "/coach/kpis", label: "Coach KPIs (/coach/kpis)" },
    { method: "GET", path: "/coach/clients", label: "Coach Athletes/Clients (/coach/clients)" },
    { method: "GET", path: "/coach/checkins/today", label: "Today Check-ins (/coach/checkins/today)" },
    { method: "GET", path: "/coach/checkins/history", label: "Check-ins History (/coach/checkins/history)" },
    { method: "GET", path: "/coach/revenue", label: "Revenue Stats (/coach/revenue)" },
    { method: "GET", path: "/coach/ranking", label: "Athletes Ranking (/coach/ranking)" },
    { method: "GET", path: "/coach/notifications", label: "Coach Notifications (/coach/notifications)" },
    { method: "GET", path: "/exercises?limit=20", label: "Exercises Catalog (/exercises)" },
    { method: "GET", path: "/exercises/categories", label: "Exercise Categories (/exercises/categories)" },
    { method: "GET", path: "/workout-plans", label: "Workout Plans (/workout-plans)" },
    { method: "GET", path: "/workout-plans/templates", label: "Workout Templates (/workout-plans/templates)" },
    { method: "GET", path: "/meal-plans", label: "Meal Plans (/meal-plans)" },
    { method: "GET", path: "/meal-plans/templates", label: "Meal Plan Templates (/meal-plans/templates)" },
    { method: "GET", path: "/chat/conversations", label: "Chat Conversations (/chat/conversations)" },
    { method: "GET", path: "/users", label: "Users List (/users)" },
    { method: "GET", path: "/subscriptions", label: "Subscriptions List (/subscriptions)" },
  ];

  for (const ep of endpointsToTest) {
    try {
      const res = await fetch(`${BACKEND_URL}${ep.path}`, {
        method: ep.method,
        headers: authHeaders,
        signal: AbortSignal.timeout(10000)
      });
      const status = res.status;
      let body;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }

      const isSuccess = status >= 200 && status < 300;
      results.backendEndpoints.push({
        label: ep.label,
        path: ep.path,
        method: ep.method,
        status,
        success: isSuccess,
        dataSummary: typeof body === "object" ? (Array.isArray(body) ? `Array(${body.length})` : Object.keys(body || {})) : String(body).slice(0, 100)
      });

      if (isSuccess) {
        console.log(`✅ [${status}] ${ep.label}`);
      } else {
        console.warn(`⚠️ [${status}] ${ep.label} ->`, typeof body === "object" ? JSON.stringify(body) : body);
        results.errors.push({
          type: "BACKEND_ENDPOINT_ERROR",
          endpoint: ep.path,
          status,
          response: body
        });
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${ep.label}: ${err.message}`);
      results.backendEndpoints.push({
        label: ep.label,
        path: ep.path,
        method: ep.method,
        status: 0,
        success: false,
        error: err.message
      });
      results.errors.push({
        type: "BACKEND_ENDPOINT_EXCEPTION",
        endpoint: ep.path,
        error: err.message
      });
    }
  }

  // 3. Test Frontend Pages on Vercel with Auth Cookie
  console.log("\n[3] Testing Frontend Routes on Vercel...");
  const frontendPagesToTest = [
    { path: "/login", label: "Login Page" },
    { path: "/dashboard", label: "Coach Dashboard" },
    { path: "/users", label: "Athletes/Users Management" },
    { path: "/pointage", label: "Pointage / Check-ins" },
    { path: "/classification", label: "Classification / Leaderboard" },
    { path: "/notifications", label: "Notifications Page" },
    { path: "/settings", label: "Coach Settings" },
    { path: "/messages", label: "Coach Messages / Chat" }
  ];

  for (const page of frontendPagesToTest) {
    try {
      // Test without cookie (or with cookie)
      const resWithAuth = await fetch(`${FRONTEND_URL}${page.path}`, {
        headers: {
          "Cookie": `9awi_access=${token}`
        },
        redirect: "manual",
        signal: AbortSignal.timeout(10000)
      });

      const status = resWithAuth.status;
      const location = resWithAuth.headers.get("location");
      const isRedirect = status === 307 || status === 308 || status === 302 || status === 301;
      const html = isRedirect ? "" : await resWithAuth.text();

      const hasErrorInHtml = html.includes("Application error") || html.includes("500 Internal Server Error") || html.includes("Unhandled Runtime Error");

      results.frontendPages.push({
        label: page.label,
        path: page.path,
        status,
        redirectLocation: location,
        hasError: hasErrorInHtml,
        htmlLength: html.length
      });

      if ((status === 200 || (isRedirect && !location?.includes("/login"))) && !hasErrorInHtml) {
        console.log(`✅ [${status}] ${page.label} (${page.path}) ${isRedirect ? `-> Redirect to: ${location}` : `(HTML size: ${html.length}b)`}`);
      } else {
        console.warn(`⚠️ [${status}] ${page.label} (${page.path}) ${isRedirect ? `-> Redirected to ${location}` : `Has error: ${hasErrorInHtml}`}`);
        if (hasErrorInHtml || (isRedirect && location?.includes("/login") && page.path !== "/login")) {
          results.errors.push({
            type: "FRONTEND_PAGE_ERROR",
            page: page.path,
            status,
            redirect: location
          });
        }
      }
    } catch (err) {
      console.error(`❌ [ERROR] Frontend ${page.path}: ${err.message}`);
      results.frontendPages.push({
        label: page.label,
        path: page.path,
        status: 0,
        error: err.message
      });
      results.errors.push({
        type: "FRONTEND_PAGE_EXCEPTION",
        page: page.path,
        error: err.message
      });
    }
  }

  console.log("\n==================================================");
  console.log(`TOTAL ERRORS / ISSUES DETECTED: ${results.errors.length}`);
  console.log("==================================================");

  return results;
}

testAll().then(res => {
  console.log("\nSummary JSON:");
  console.log(JSON.stringify(res, null, 2));
}).catch(console.error);
