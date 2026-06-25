import Supermemory from 'supermemory';

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

export async function saveMemory(
  userId: string,
  text: string
) {
  try {
    await client.add({
      content: text,
      containerTags: [userId],
    });

    console.log('Memory saved');
  } catch (error) {
    console.error('Save memory error:', error);
  }
}

export async function retrieveMemory(
  userId: string,
  query: string
) {
  try {
    const result = await client.profile({
      containerTag: userId,
      q: query,
    });

    return JSON.stringify(result);
  } catch (error) {
    console.error('Retrieve memory error:', error);

    return '';
  }
}