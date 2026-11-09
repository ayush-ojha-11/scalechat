import { pool } from "../../infrastructure/database/index.js";

export async function createRefreshToken({
  userId,
  familyId,
  tokenHash,
  expiresAt,
}) {
  const query = `
    INSERT INTO refresh_tokens (
      user_id,
      family_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const result = await pool.query(query, [
    userId,
    familyId,
    tokenHash,
    expiresAt,
  ]);

  return result.rows[0];
}

export async function revokeRefreshToken(tokenHash) {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = $1
      AND revoked_at IS NULL
    RETURNING id
  `;

  const result = await pool.query(query, [tokenHash]);

  return result.rows[0] ?? null;
}

export async function revokeTokenFamily(familyId) {
  await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = COALESCE(revoked_at, NOW())
      WHERE family_id = $1
    `,
    [familyId],
  );
}

export async function rotateRefreshToken({
  oldTokenHash,
  newTokenHash,
  newExpiresAt,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the existing token row.
    const tokenResult = await client.query(
      `
        SELECT
          rt.id,
          rt.user_id,
          rt.family_id,
          rt.expires_at,
          rt.revoked_at,
          u.username,
          u.email
        FROM refresh_tokens rt
        JOIN users u ON u.id = rt.user_id
        WHERE rt.token_hash = $1
        FOR UPDATE OF rt
      `,
      [oldTokenHash],
    );

    const oldToken = tokenResult.rows[0];

    if (!oldToken) {
      await client.query("COMMIT");
      return { status: "not_found" };
    }

    // A previously rotated token was reused.
    // Revoke every token in this session family.
    if (oldToken.revoked_at) {
      await client.query(
        `
          UPDATE refresh_tokens
          SET revoked_at = COALESCE(revoked_at, NOW())
          WHERE family_id = $1
        `,
        [oldToken.family_id],
      );

      await client.query("COMMIT");

      return { status: "reuse_detected" };
    }

    if (new Date(oldToken.expires_at) <= new Date()) {
      await client.query("COMMIT");
      return { status: "expired" };
    }

    // Create the replacement token.
    const newTokenResult = await client.query(
      `
        INSERT INTO refresh_tokens (
          user_id,
          family_id,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [oldToken.user_id, oldToken.family_id, newTokenHash, newExpiresAt],
    );

    const newTokenId = newTokenResult.rows[0].id;

    // Revoke the old token and link it to its replacement.
    await client.query(
      `
        UPDATE refresh_tokens
        SET
          revoked_at = NOW(),
          replaced_by_token_id = $2
        WHERE id = $1
      `,
      [oldToken.id, newTokenId],
    );

    await client.query("COMMIT");

    return {
      status: "rotated",
      user: {
        id: oldToken.user_id,
        username: oldToken.username,
        email: oldToken.email,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
