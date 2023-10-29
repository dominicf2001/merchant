import { Users } from "../src/database/db-objects";

describe('Users Database BALANCE Operations', () => {

    const testUserId = '123';

    afterEach(async () => {
        await Users.delete(testUserId);
    });
    
    afterAll(async () => {
        await Users.destroyDB();
    });

    test('Add balance with an uncreated user', async () => {
        await Users.addBalance(testUserId, 5);
        const testUser = await Users.get(testUserId);
        
        expect(testUser).not.toBeNull();
        expect(testUser?.balance).toBe(5);
    });

    test('Subtract balance with an existing user', async () => {
        await Users.set(testUserId, {balance: 12});
        
        await Users.addBalance(testUserId, -4);
        const testUser = await Users.get(testUserId);

        expect(testUser).not.toBeNull();
        expect(testUser?.balance).toBe(8);
    });

    test('Subtracting balance below zero', async () => {
        await Users.set(testUserId, { balance: 101 });

        await Users.addBalance(testUserId, -200);
        const testUser = await Users.get(testUserId);

        expect(testUser).not.toBeNull();
        expect(testUser?.balance).toBe(0);
    });
});
