import { Users, Items } from "@alias/db-objects";

describe('BALANCE, ACTIVITY_POINTS, ARMOR Operations', () => {

    const testUserId = '123';

    beforeAll(async () => {
        await Users.delete(testUserId);
    });
    
    afterEach(async () => {
        await Users.delete(testUserId);
    });

    // ADDING + NON-EXISTING
    test('Add balance to a non-existing user', async () => {
        await Users.addBalance(testUserId, 5);
        
        const balance = await Users.getBalance(testUserId);
        
        expect(balance).toBe(5);

        let user = Users.getFromCache(testUserId);
        expect(user?.balance).toBe(5);
        user = await Users.getFromDB(testUserId);
        expect(user?.balance).toBe(5);
    });

    test('Add armor to a non-existing user', async () => {
        await Users.addArmor(testUserId, 12);
        const armor = await Users.getArmor(testUserId);
        
        expect(armor).toBe(12);

        let user = Users.getFromCache(testUserId);
        expect(user?.armor).toBe(12);
        user = await Users.getFromDB(testUserId);
        expect(user?.armor).toBe(12);
    });

    test('Add activity points to a non-existing user', async () => {
        await Users.addActivityPoints(testUserId, 1);
        const activityPoints = await Users.getActivityPoints(testUserId);

        expect(activityPoints).toBe(1);

        let user = Users.getFromCache(testUserId);
        expect(user?.activity_points).toBe(1);
        user = await Users.getFromDB(testUserId);
        expect(user?.activity_points).toBe(1);
    });

    // SUBTRACTING + EXISTING
    test('Subtract balance from an existing user', async () => {
        await Users.set(testUserId, { balance: 12 });
        
        await Users.addBalance(testUserId, -4);
        const balance = await Users.getBalance(testUserId);
        
        expect(balance).toBe(8);

        let user = Users.getFromCache(testUserId);
        expect(user?.balance).toBe(8);
        user = await Users.getFromDB(testUserId);
        expect(user?.balance).toBe(8);
    });

    test('Subtract armor from an existing user', async () => {
        await Users.set(testUserId, { armor: 100 });

        await Users.addArmor(testUserId, -30);
        const armor = await Users.getArmor(testUserId);

        expect(armor).toBe(70);

        let user = Users.getFromCache(testUserId);
        expect(user?.armor).toBe(70);
        user = await Users.getFromDB(testUserId);
        expect(user?.armor).toBe(70);
    });

    test('Subtract activity points from an existing user', async () => {
        await Users.set(testUserId, { activity_points: 2 });

        await Users.addActivityPoints(testUserId, -2);
        const activityPoints = await Users.getActivityPoints(testUserId);

        expect(activityPoints).toBe(0);

        let user = Users.getFromCache(testUserId);
        expect(user?.activity_points).toBe(0);
        user = await Users.getFromDB(testUserId);
        expect(user?.activity_points).toBe(0);
    });

    // SUBTRACTING BELOW ZERO

    test('Subtract balance from an existing user below zero', async () => {
        await Users.set(testUserId, { balance: 101 });

        await Users.addBalance(testUserId, -200);
        const balance = await Users.getBalance(testUserId);
        
        expect(balance).toBe(0);

        let user = Users.getFromCache(testUserId);
        expect(user?.balance).toBe(0);
        user = await Users.getFromDB(testUserId);
        expect(user?.balance).toBe(0);
    });

    test('Subtract armor from an existing user below zero', async () => {
        await Users.set(testUserId, { armor: 20 });

        await Users.addArmor(testUserId, -21);
        const armor = await Users.getArmor(testUserId);

        expect(armor).toBe(0);

        let user = Users.getFromCache(testUserId);
        expect(user?.armor).toBe(0);
        user = await Users.getFromDB(testUserId);
        expect(user?.armor).toBe(0);
    });

    test('Subtract activity points from an existing user below zero', async () => {
        await Users.set(testUserId, { activity_points: 1 });

        await Users.addActivityPoints(testUserId, -1000);
        const activityPoints = await Users.getActivityPoints(testUserId);

        expect(activityPoints).toBe(0);

        let user = Users.getFromCache(testUserId);
        expect(user?.activity_points).toBe(0);
        user = await Users.getFromDB(testUserId);
        expect(user?.activity_points).toBe(0);
    });
});

describe('ITEMS operations', () => {
    const testUserId = '123';
    const testItemOneId = 'test item one';
    const testItemTwoId = 'test item two';

    beforeAll(async () => {
        await Items.set(testItemOneId);
        await Items.set(testItemTwoId);
        await Users.delete(testUserId);
    });
    
    afterEach(async () => {
        await Users.delete(testUserId);
        setTimeout(()=>{}, 100);
    });

    afterAll(async () => {
        await Items.delete(testItemOneId);
        await Items.delete(testItemTwoId);
    });

    test('Add item to a non-existing user', async () => {
        await Users.addItem(testUserId, testItemOneId, 1);
        const testItemOne = await Users.getItem(testUserId, testItemOneId);
        const testItems = await Users.getItems(testUserId);
        
        expect(testItemOne?.quantity).toBe(1);
        expect(testItems).toContainEqual(testItemOne);
    });

    test('Add multiple items to an existing user', async () => {
        await Users.set(testUserId);
        
        await Users.addItem(testUserId, testItemOneId, 1);
        
        await Users.addItem(testUserId, testItemTwoId, 1);
        await Users.addItem(testUserId, testItemTwoId, 1);
        
        const testItemOne = await Users.getItem(testUserId, testItemOneId);
        const testItemTwo = await Users.getItem(testUserId, testItemTwoId);
        const testItems = await Users.getItems(testUserId);

        expect(testItemOne?.quantity).toBe(1);
        expect(testItemTwo?.quantity).toBe(2);
        expect(testItems).toContainEqual(testItemOne);
        expect(testItems).toContainEqual(testItemTwo);
    });

    test('Delete item from a non-existing user', async () => {
        await Users.addItem(testUserId, testItemOneId, -1);
    });

    test('Delete item from a existing user with items, below zero and non-below zero', async () => {
        await Users.set(testUserId);
        
        await Users.addItem(testUserId, testItemOneId, 5);

        await Users.addItem(testUserId, testItemTwoId, 10);

        await Users.addItem(testUserId, testItemOneId, -5);
        await Users.addItem(testUserId, testItemTwoId, -9);

        const testItemOne = await Users.getItem(testUserId, testItemOneId);
        const testItemTwo = await Users.getItem(testUserId, testItemTwoId);
        const testItems = await Users.getItems(testUserId);

        expect(testItemOne).not.toBeDefined();
        expect(testItemTwo?.quantity).toBe(1);
        expect(testItems).not.toContainEqual(testItemOne);
        expect(testItems).toContainEqual(testItemTwo);
    });
});

afterAll(() => {
    Users.destroyDB();
});
