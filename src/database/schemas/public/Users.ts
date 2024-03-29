// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.users */
export type UsersUserId = string & { __brand: 'UsersUserId' };

/** Represents the table public.users */
export default interface UsersTable {
  user_id: ColumnType<UsersUserId, UsersUserId, UsersUserId | null>;

  balance: ColumnType<number, number | null, number | null>;

  armor: ColumnType<number, number | null, number | null>;
}

export type Users = Selectable<UsersTable>;

export type NewUsers = Insertable<UsersTable>;

export type UsersUpdate = Updateable<UsersTable>;
