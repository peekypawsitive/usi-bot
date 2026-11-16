import { settings } from '@devvit/web/server';

export async function searchYoutube(query: string) {
  const key = await settings.get('youtube-api-key');

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '3',
    q: query,
    key: key ?? '',
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );

  if (!res.ok) throw new Error(`YouTube: ${res.status}`);

  const data = await res.json();

  return data.items.map((item: any) => ({
    title: item.snippet.title,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
  }));
}

export async function playYoutube(
  query: string,
  username: string
) {
  const videos = await searchYoutube(query);

  if (!videos.length) return 'No results found.';

  const { title, url } = videos[0];
  const id = new URL(url).searchParams.get('v');

  return [
    `###NOW PLAYING: ${title}`,
    `Requested by u/${username}`,
    `[YouTube](https://youtube.com/watch?v=${id})      [YTMusic](https://music.youtube.com/watch?v=${id}) `,
    'Greetings from r/unitedstatesofindia!'
  ].join('\n\n');
}


