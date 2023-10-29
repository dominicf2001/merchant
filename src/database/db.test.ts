import { Users } from "./db-objects.ts";

describe('Users Database Operations', () => {

    const testUserId = '123';

    // This runs before each test in this block
    beforeEach(async () => {
        await Users.delete(testUserId);
    });

    afterEach(async () => {
        await Users.destroyDB();
    });

    test('Add balance with an uncreated user', async () => {
        await Users.addBalance(testUserId, 5);
        const testUser = await Users.get(testUserId);
        expect(testUser).not.toBeNull();
        expect(testUser?.balance).toBe(5);
    });
});
