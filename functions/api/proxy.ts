export const onRequest = async ({ request }: { request: Request }) => {
  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get('playlistId')

  if (!playlistId || !/^[a-zA-Z0-9_-]{5,}$/.test(playlistId)) {
    return new Response(JSON.stringify({ error: 'Invalid playlistId' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const youtubeUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`

  const response = await fetch(youtubeUrl, {
    method: 'GET',
    headers: {
      accept: 'text/html',
      'user-agent':
        'Mozilla/5.0 (compatible; PlaylistRankerProxy/1.0; +https://github.com/Asion001/youtube-playlist-ran)',
    },
  })

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch playlist' }), {
      status: response.status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const html = await response.text()

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
}
