import { Client } from 'pg';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || '4gaBoards',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mypassword123',
};

export async function getDbClient(): Promise<Client> {
  const client = new Client(DB_CONFIG);
  await client.connect();
  return client;
}

export async function assertUserExistsInDb(email: string): Promise<void> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id, email FROM user_account WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (res.rowCount === 0) {
      throw new Error(`[DB Assertion Failed] User with email "${email}" not found in database.`);
    }
    console.log(`[DB ✓] User found in DB: ${res.rows[0].email} (id: ${res.rows[0].id})`);
  } finally {
    await client.end();
  }
}

export async function getUserIdByEmail(email: string): Promise<string> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id FROM user_account WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (res.rowCount === 0) throw new Error(`User not found in DB: ${email}`);
    return res.rows[0].id;
  } finally {
    await client.end();
  }
}

export async function assertBoardExistsInDb(boardName: string): Promise<string> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id, name FROM board WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [boardName],
    );
    if (res.rowCount === 0) {
      throw new Error(`[DB Assertion Failed] Board "${boardName}" not found in database.`);
    }
    console.log(`[DB ✓] Board found in DB: "${res.rows[0].name}" (id: ${res.rows[0].id})`);
    return res.rows[0].id;
  } finally {
    await client.end();
  }
}

export async function assertBoardNotInDb(boardName: string): Promise<void> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id FROM board WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [boardName],
    );
    if (res.rowCount! > 0) {
      throw new Error(`[DB Assertion Failed] Board "${boardName}" still exists in database after deletion.`);
    }
    console.log(`[DB ✓] Board correctly absent from DB: "${boardName}"`);
  } finally {
    await client.end();
  }
}

export async function assertListExistsInDb(listName: string, boardId: string): Promise<string> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id, name FROM list WHERE LOWER(name) = LOWER($1) AND board_id = $2 LIMIT 1`,
      [listName, boardId],
    );
    if (res.rowCount === 0) {
      throw new Error(`[DB Assertion Failed] List "${listName}" not found in DB under board ${boardId}.`);
    }
    console.log(`[DB ✓] List found in DB: "${res.rows[0].name}" (id: ${res.rows[0].id})`);
    return res.rows[0].id;
  } finally {
    await client.end();
  }
}

export async function assertCardExistsInDb(cardTitle: string, listId: string): Promise<string> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id, name FROM card WHERE LOWER(name) = LOWER($1) AND list_id = $2 LIMIT 1`,
      [cardTitle, listId],
    );
    if (res.rowCount === 0) {
      throw new Error(`[DB Assertion Failed] Card "${cardTitle}" not found in DB under list ${listId}.`);
    }
    console.log(`[DB ✓] Card found in DB: "${res.rows[0].name}" (id: ${res.rows[0].id})`);
    return res.rows[0].id;
  } finally {
    await client.end();
  }
}

export async function assertCardMovedInDb(cardId: string, expectedListId: string): Promise<void> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id, name, list_id FROM card WHERE id = $1 LIMIT 1`,
      [cardId],
    );
    if (res.rowCount === 0) throw new Error(`Card with id ${cardId} not found in DB.`);
    const actualListId = res.rows[0].list_id;
    if (actualListId !== expectedListId) {
      throw new Error(
        `[DB Assertion Failed] Card list_id mismatch. Expected: ${expectedListId}, Got: ${actualListId}`,
      );
    }
    console.log(`[DB ✓] Card correctly moved in DB to list_id: ${expectedListId}`);
  } finally {
    await client.end();
  }
}

export async function assertCardNotInDb(cardId: string): Promise<void> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT id FROM card WHERE id = $1 LIMIT 1`,
      [cardId],
    );
    if (res.rowCount! > 0) {
      throw new Error(`[DB Assertion Failed] Card ${cardId} still exists in DB after deletion.`);
    }
    console.log(`[DB ✓] Card correctly deleted from DB.`);
  } finally {
    await client.end();
  }
}

export async function assertCardTitleInDb(cardId: string, expectedTitle: string): Promise<void> {
  const client = await getDbClient();
  try {
    const res = await client.query(
      `SELECT name FROM card WHERE id = $1 LIMIT 1`,
      [cardId],
    );
    if (res.rowCount === 0) throw new Error(`Card ${cardId} not found in DB.`);
    const actualTitle = res.rows[0].name;
    if (actualTitle.toLowerCase() !== expectedTitle.toLowerCase()) {
      throw new Error(
        `[DB Assertion Failed] Card title mismatch. Expected: "${expectedTitle}", Got: "${actualTitle}"`,
      );
    }
    console.log(`[DB ✓] Card title in DB matches: "${actualTitle}"`);
  } finally {
    await client.end();
  }
}
