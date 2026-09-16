// Server-side proxy to the ASP.NET Core API.
//
// The backend is HTTP only (MonsterASP free plan has no SSL), and a browser
// on an HTTPS page refuses to call it. A vercel.json rewrite to an http://
// destination is not honoured either, so the forwarding happens here instead:
// this function runs on Vercel's servers, where mixed-content rules and CORS
// do not apply.

const BACKEND = "http://sems.runasp.net";

export default async function handler(request, response) {
  const raw = request.query.path;
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const queryIndex = request.url.indexOf("?");
  const search = queryIndex === -1 ? "" : request.url.slice(queryIndex);

  const target = `${BACKEND}/api/${segments.join("/")}${search}`;

  const headers = { accept: "application/json" };

  // Pass the Firebase ID token through untouched.
  if (request.headers.authorization) {
    headers.authorization = request.headers.authorization;
  }

  const sendsBody = !["GET", "HEAD"].includes(request.method);

  if (sendsBody) {
    headers["content-type"] = "application/json";
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: sendsBody ? JSON.stringify(request.body ?? {}) : undefined,
    });

    const contentType =
      upstream.headers.get("content-type") ?? "application/json";
    const payload = await upstream.text();

    response.status(upstream.status);
    response.setHeader("content-type", contentType);
    return response.send(payload);
  } catch (error) {
    // Surface the real reason instead of letting it look like a 404.
    return response.status(502).json({
      message: `Proxy could not reach the API at ${BACKEND}.`,
      detail: error?.message ?? String(error),
      target,
    });
  }
}
