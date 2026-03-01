const getAllowedOrigins = (env) =>
  new Set(
    (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

const extractOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; PlaylistRankerProxy/1.0; +https://github.com/Asion001/youtube-playlist-ran)";

export default {
  async fetch(request, env) {
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const allowedOrigins = getAllowedOrigins(env);
    const originHeader = extractOrigin(request.headers.get("origin"));
    const refererOrigin = extractOrigin(request.headers.get("referer"));
    const sourceOrigin = originHeader ?? refererOrigin;

    if (!sourceOrigin || !allowedOrigins.has(sourceOrigin)) {
      return new Response(JSON.stringify({ error: "Forbidden origin" }), {
        status: 403,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlistId");
    const continuation = searchParams.get("continuation");
    const apiKey = searchParams.get("apiKey");
    const clientVersion = searchParams.get("clientVersion");

    if (continuation) {
      if (!apiKey || apiKey.length < 10 || apiKey.length > 256) {
        return new Response(JSON.stringify({ error: "Invalid apiKey" }), {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      if (continuation.length < 8 || continuation.length > 4096) {
        return new Response(
          JSON.stringify({ error: "Invalid continuation token" }),
          {
            status: 400,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }

      const youtubeApiUrl = `https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(youtubeApiUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "user-agent": USER_AGENT,
        },
        body: JSON.stringify({
          continuation,
          context: {
            client: {
              clientName: "WEB",
              clientVersion:
                clientVersion && clientVersion.length <= 64
                  ? clientVersion
                  : "2.20240224.00.00",
            },
          },
        }),
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch continuation" }),
          {
            status: response.status,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }

      const payload = await response.text();
      return new Response(payload, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=120",
        },
      });
    }

    if (!playlistId || !/^[a-zA-Z0-9_-]{10,128}$/.test(playlistId)) {
      return new Response(JSON.stringify({ error: "Invalid playlistId" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const youtubeUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
    const response = await fetch(youtubeUrl, {
      method: "GET",
      headers: {
        accept: "text/html",
        "user-agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch playlist" }),
        {
          status: response.status,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    const html = await response.text();
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  },
};
