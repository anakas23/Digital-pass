import { writeFile } from 'node:fs/promises';

export async function getToken(
    authority: string,
    audience: string,
    clientId: string,
    clientSecret: string,
    scope: string
): Promise<string> {
    const response = await fetch(`${authority}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: audience,
            scope: scope,
        }),
    });

    if (!response.ok) {
        throw new Error(`Token request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function issuePass(
  url: string,
  token: string,
  name: string,
  document: string
): Promise<void> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },  
        body: JSON.stringify({ name: name, document: document }),
    });

    if (!response.ok) {
        throw new Error(`Issuing pass failed with status ${response.status}`);
    }

    //location:https://.../passes/<id>
    const location = response.headers.get('Location') ?? '';
    const id = location.split('/').pop();

    const image = Buffer.from(await response.arrayBuffer());
    await writeFile(`${id}.png`, image);
}