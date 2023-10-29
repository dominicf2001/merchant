import { Users, Items } from "../src/database/db-objects";

describe('Users Database BALANCE Operations', () => {

    const testUserId = '123';

    beforeAll(async () => {
        await Users.delete(testUserId); 
    });
    
    afterEach(async () => {
        await Users.delete(testUserId);
    });

    test('Add balance to a non-existing user', async () => {
        await Users.addBalance(testUserId, 5);
        const testUser = await Users.get(testUserId);
        
        expect(testUser).not.toBeNull();
        expect(testUser?.balance).toBe(5);
    });

    test('Subtract balance from an existing user', async () => {
        await Users.set(testUserId, {balance: 12});
        
        await Users.addBalance(testUserId, -4);
        const testUser = await Users.get(testUserId);
        
        expect(testUser?.balance).toBe(8);
    });

    test('Subtract balance from an existing user below zero', async () => {
        await Users.set(testUserId, { balance: 101 });

        await Users.addBalance(testUserId, -200);
        const testUser = await Users.get(testUserId);

        expect(testUser).not.toBeNull();
        expect(testUser?.balance).toBe(0);
    });
});

describe('Users, UserItems Database ITEMS operations', () => {
    const testUserId = '123';
    const testItemOneId = 'test item one';
    const testItemTwoId = 'test item two';

    beforeAll(async () => {
        await Items.set(testItemOneId);
        await Items.set(testItemTwoId);
    });

    afterAll(async () => {
        await Items.delete(testItemOneId);
        await Items.delete(testItemTwoId); 
    });

    afterEach(async () => {
        await Users.delete(testUserId); 
    });

    test('Add item to a non-existing user', async () => {
        await Users.addItem(testUserId, testItemOneId);
        const testItemOne = await Users.getItem(testUserId, testItemOneId);
        const testItems = await Users.getItems(testUserId);
        
        expect(testItemOne?.quantity).toBe(1);
        expect(testItems).toContainEqual(testItemOne);
    });

    test('Add multiple items to an existing user', async () => {
        await Users.set(testUserId);
        
        await Users.addItem(testUserId, testItemOneId);
        
        await Users.addItem(testUserId, testItemTwoId);
        await Users.addItem(testUserId, testItemTwoId);
        
        const testItemOne = await Users.getItem(testUserId, testItemOneId);
        const testItemTwo = await Users.getItem(testUserId, testItemOneId);
        const testItems = await Users.getItems(testUserId);

        expect(testItemOne?.quantity).toBe(1);
        expect(testItems).toContainEqual(testItemOne);
        expect(testItems).toContainEqual(testItemTwo);
    });
});

afterAll(() => {
    Users.destroyDB();
});
