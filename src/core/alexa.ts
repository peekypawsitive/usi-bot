import { reddit } from '@devvit/web/server';
import { playYoutube } from '../utils/youtube';

async function getParentText(parentId: string) {
  if (parentId.startsWith('t1_')) {
    const parent = await reddit.getCommentById(parentId);
    return parent.body;
  }

  const post = await reddit.getPostById(parentId);
  return `${post.title}\n${post.body ?? ''}`;
}

async function processCommand(
  line: string,
  parentId: string,
  username: string
) {
  const [person, command, ...args] = line.split(/\s+/);
  let query = args.join(' ');

  if (!['alexa', 'bablu'].includes(person.toLowerCase())) {
    return '';
  }

  if (!['play', 'spotify'].includes(command?.toLowerCase())) {
    return '';
  }

  if (!query || query.toLowerCase() === 'this') {
    query = await getParentText(parentId);
  }

  if (!query.trim()) return 'Nothing to search, mate.';

  try {
    let response = '';

    if (command.toLowerCase() === 'play') {
      response = await playYoutube(query, username);
    }

    if (command.toLowerCase() === 'spotify') {
      response = `### [Search Spotify](` +
        `https://open.spotify.com/search/${encodeURIComponent(query)})`;
    }

    return person.toLowerCase() === 'bablu'
      ? `^(tohar vaaste ek geet babuah.)\n\n${response} \n\n ^(ab ghare jaake sutti babu; no late night wakey wakey, boojhe?)`
      : `${response}`;

  } catch (err) {
    console.error('Alexa:', err);
    return 'Something went wrong while searching.';
  }
}


export async function processAlexa(
  body: string,
  parentId: string,
  username: string
) {
  const lines = body.split('\n').map(line => line.trim());
  const responses = [];

  for (const line of lines) {
    if (!/^(alexa|bablu)\b/i.test(line)) continue;

    const response = await processCommand(
      line,
      parentId,
      username
    );

    if (response) responses.push(response);
  }

  return responses.join('\n\n---\n\n');
}
