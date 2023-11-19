import { DataStore, db } from './DataStore';
import { Users as User, UsersUserId } from '../schemas/public/Users';
import { UserItems as UserItem } from '../schemas/public/UserItems';
import { UserStocks as UserStock } from '../schemas/public/UserStocks';
import { UserActivities as UserActivity } from '../schemas/public/UserActivities';
import { Stocks as Stock } from '../schemas/public/Stocks';
import { UserCooldowns as UserCooldown } from '../schemas/public/UserCooldowns';
import { CommandsCommandId } from '../schemas/public/Commands';
import { UserStocksPurchaseDate } from '../schemas/public/UserStocks';
import { ItemsItemId } from '../schemas/public/Items';
import { DateTime } from 'luxon';
import Database from '../schemas/Database';
import { Kysely, Insertable, Updateable } from 'kysely';
import { Items } from './Items';
import { Stocks } from './Stocks';
import { Commands } from './Commands';

class Users extends DataStore<User> {
    async set(id: string, data: Insertable<User> | Updateable<User> = {}): Promise<void> {
        const newUser: User = { [this.tableID]: id as UsersUserId, ...data } as User;

        try {
            let result: User = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.tableID, '=', id as UsersUserId)
                .executeTakeFirst() as User;

            if (result) {
                result = await this.db
                    .updateTable(this.tableName)
                    .set(newUser)
                    .where(this.tableID, '=', id as UsersUserId)
                    .returningAll()
                    .executeTakeFirstOrThrow() as User;
            }
            else {
                result = await this.db
                    .insertInto(this.tableName)
                    .values(newUser)
                    .returningAll()
                    .executeTakeFirstOrThrow() as User;

                await this.addActivityPoints(id, 0);
            }

            this.cache.set(id, [result]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    
    async addBalance(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);
        
        let newBalance = user ? (user.balance + amount) : amount;
        if (newBalance < 0) newBalance = 0;

        await this.set(user_id, {
            balance: newBalance
        });
    }

    async addArmor(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);

        let newArmor = user ? (user.armor + amount) : amount;
        if (newArmor < 0) newArmor = 0;

        await this.set(user_id, {
            armor: newArmor
        });
    }

    async addActivityPoints(user_id: string, amount: number): Promise<void> {
        await this.db.transaction().execute(async trx => {
            await this.set(user_id);

            const activity = await trx
                .selectFrom('user_activities')
                .selectAll()
                .where('user_id', '=', user_id as UsersUserId)
                .executeTakeFirst();
            
            if (!activity) {
                await trx
                    .insertInto('user_activities')
                    .values({
                        user_id: user_id as UsersUserId,
                        activity_points_short: amount,
                        activity_points_long: amount,
                        first_activity_date: DateTime.now().toISO(),
                        last_activity_date: DateTime.now().toISO()
                    })
                    .execute();
            }
            else {
                let newActivityPointsShort = activity.activity_points_short + amount;
                if (newActivityPointsShort < 0) newActivityPointsShort = 0;

                let newActivityPointsLong = activity.activity_points_long + amount;
                if (newActivityPointsLong < 0) newActivityPointsLong = 0;
                await trx
                    .updateTable('user_activities')
                    .set({
                        activity_points_short: newActivityPointsShort,
                        activity_points_long: newActivityPointsLong,
                        last_activity_date: DateTime.now().toISO()
                    })
                    .where('user_id', '=', user_id as UsersUserId)
                    .execute();
            }
        });
    }
    
    async addItem(user_id: string, item_id: string, amount: number): Promise<number> {
        let amountAdded = 0;

        await this.db.transaction().execute(async trx => {
            // Check if item exists
            const item = await Items.get(item_id);
            
            if (!item)
                return;

            if (amount > 0) {
                // If amount is positive, increment the existing record or insert a new one.
                const userItem = await trx
                    .selectFrom('user_items')
                    .selectAll()
                    .where('user_id', '=', user_id as any)
                    .where('item_id', '=', item_id as any)
                    .executeTakeFirst();

                if (!userItem) {
                    await this.set(user_id);

                    await trx
                        .insertInto('user_items')
                        .values({
                            user_id: user_id as UsersUserId,
                            item_id: item_id as ItemsItemId,
                            quantity: amount
                        })
                        .execute();
                } else {
                    const newQuantity = userItem.quantity + amount;
                    await trx
                        .updateTable('user_items')
                        .set({ quantity: newQuantity })
                        .where('user_id', '=', user_id as any)
                        .where('item_id', '=', item_id as any)
                        .execute();
                }

                amountAdded = amount;
            } else if (amount < 0) {
                // If amount is negative, decrement the existing record.
                const userItem = await trx
                    .selectFrom('user_items')
                    .selectAll()
                    .where('user_id', '=', user_id as any)
                    .where('item_id', '=', item_id as any)
                    .executeTakeFirst();

                if (userItem) {
                    const oldQuantity = userItem.quantity;
                    const newQuantity = oldQuantity + amount;  // amount is negative
                    if (newQuantity <= 0) {
                        await trx
                            .deleteFrom('user_items')
                            .where('user_id', '=', user_id as any)
                            .where('item_id', '=', item_id as any)
                            .execute();
                        amountAdded = -oldQuantity;  // All items were removed
                    } else {
                        await trx
                            .updateTable('user_items')
                            .set({ quantity: newQuantity })
                            .where('user_id', '=', user_id as any)
                            .where('item_id', '=', item_id as any)
                            .execute();
                        amountAdded = amount;
                    }
                }
            }
        });

        return amountAdded;
    }


    async setBalance(user_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        await this.set(user_id, {
            balance: amount
        });
    }

    async setActivity(id: string, data: Insertable<UserActivity> | Updateable<UserActivity> = {}): Promise<void> {
        try {
            const newUserActivity: UserActivity = {
                'user_id': id as UsersUserId,
                last_activity_date: DateTime.now().toISO(),
                ...data
            } as UserActivity;

            await this.db.transaction().execute(async trx => {
                let result: UserActivity = await trx
                    .selectFrom('user_activities')
                    .selectAll()
                    .where('user_id', '=', id as UsersUserId)
                    .executeTakeFirst() as UserActivity;

                if (result) {
                    result = await trx
                        .updateTable('user_activities')
                        .set(newUserActivity)
                        .where('user_id', '=', id as UsersUserId)
                        .returningAll()
                        .executeTakeFirstOrThrow() as UserActivity;
                }
                else {
                    await this.set(id);
                    newUserActivity.first_activity_date = DateTime.now().toISO();

                    result = await trx
                        .insertInto('user_activities')
                        .values(newUserActivity)
                        .returningAll()
                        .executeTakeFirstOrThrow() as UserActivity;
                } 
            });
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getBalance(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user?.balance ?? 0;
    }

    async getArmor(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user?.armor ?? 0;
    }

    async getActivity(user_id: string): Promise<UserActivity> {
        const userActivity = await this.db.selectFrom('user_activities')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)
            .executeTakeFirst() as UserActivity;
        return userActivity;
    }

    async getItemCount(user_id: string): Promise<number> {
        const items = await this.getItems(user_id);

        const itemCount = items?.reduce((previous, current) => {
            return previous + current.quantity;
        }, 0);

        return itemCount ?? 0;
    }

    async getItem(user_id: string, item_id: string): Promise<UserItem | undefined> {
        const userItem: UserItem = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)
            .where('item_id', '=', item_id as ItemsItemId)
            .executeTakeFirst() as UserItem;
        
        return userItem;
    }

    async getItems(user_id: string): Promise<UserItem[]> {
        const userItems: UserItem[] = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)
            .execute() as UserItem[];
        return userItems;
    }

    async getPortfolioValue(user_id: string): Promise<number> {
        const userStocks: UserStock[] = await this.getUserStocks(user_id);

        let portfolioValue = 0;
        for (const userStock of userStocks) {
            const latestPrice = (await Stocks.getLatestStock(userStock.stock_id)).price;
            portfolioValue += latestPrice * userStock.quantity;
        }
        
        return portfolioValue
    }

    async getNetWorth(user_id: string): Promise<number> {
        const portfolioValue = await this.getPortfolioValue(user_id);
        const balance = await this.getBalance(user_id);
        return portfolioValue + balance;
    }

    async getPortfolio(user_id: string): Promise<Stock[]> {
        const userStock: UserStock[] = await this.db
            .selectFrom('user_stocks')
            .select('stock_id')
            .where('user_id', '=', user_id as UsersUserId)
            .distinct()
            .execute() as UserStock[];

        // Populate with the latest stock information
         let stockPromises: Promise<Stock>[] = [];
        for (const stock of userStock) {
            stockPromises.push(Stocks.getLatestStock(stock.stock_id));
        }
        
        return await Promise.all(stockPromises) as Stock[];
    }
    
    async getUserStocks(user_id: string, stock_id?: string): Promise<UserStock[]> {
        let query = this.db
            .selectFrom('user_stocks')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)

        query = stock_id ?
            query.where('stock_id', '=', stock_id as UsersUserId) :
            query;
        
        return (
            await query
                .orderBy('purchase_date desc')
                .execute() as UserStock[]
        );
    }
    
    async addStock(user_id: string, stock_id: string, amount: number): Promise<number> {
        let amountAdded = 0;
        
        await this.db.transaction().execute(async trx => {
            const currentStockPrice: number = (await Stocks.getLatestStock(stock_id))?.price;

            // prevents a user from being created and from inserting a non-existent stock
            if (currentStockPrice == undefined)
                return;
            
            if (amount > 0) {
                await this.set(user_id);
                
                // If amount is positive, insert a new record.
                await trx
                    .insertInto('user_stocks')
                    .values({
                        user_id: user_id as UsersUserId,
                        stock_id: stock_id as UsersUserId,
                        purchase_date: DateTime.now().toISO() as UserStocksPurchaseDate,
                        quantity: amount,
                        purchase_price: currentStockPrice,
                    })
                    .execute();
                
                amountAdded = amount;
            }
            else if (amount < 0) {
                // If amount is negative, decrement the existing records.
                const userStocks = await trx
                    .selectFrom('user_stocks')
                    .selectAll()
                    .where('user_id', '=', user_id as UsersUserId)
                    .where('stock_id', '=', stock_id as UsersUserId)
                    .orderBy('purchase_date desc')
                    .execute();

                // prevents a user from being created
                if (!userStocks.length)
                    return 0; 

                // amount is negative, make it positive
                let remainingAmountToDecrement = -amount;

                for (const userStock of userStocks) {
                    if (remainingAmountToDecrement <= 0) {
                        break;
                    }

                    const decrementedQuantity = userStock.quantity - remainingAmountToDecrement;

                    if (decrementedQuantity <= 0) {
                        // If decremented quantity is zero or negative, delete the record.
                        await trx
                            .deleteFrom('user_stocks')
                            .where('user_id', '=', user_id as UsersUserId)
                            .where('stock_id', '=', stock_id as UsersUserId)
                            .where('purchase_date', '=', userStock.purchase_date)
                            .execute();

                        remainingAmountToDecrement -= userStock.quantity;  // Deduct the full quantity of this record
                    } else {
                        // If decremented quantity is positive, update the record.
                        await trx
                            .updateTable('user_stocks')
                            .set({ quantity: decrementedQuantity })
                            .where('user_id', '=', user_id as UsersUserId)
                            .where('stock_id', '=', stock_id as UsersUserId)
                            .where('purchase_date', '=', userStock.purchase_date)
                            .execute();

                        remainingAmountToDecrement = 0;  // Stop, as all amount has been decremented
                    }
                    amountAdded = amount + remainingAmountToDecrement;
                }
            }
        });
        return amountAdded;
    }
    
    async getRemainingCooldownDuration(user_id: string, command_id: string): Promise<number> {
        const command = await Commands.get(command_id);
        const cooldownAmount: number = command.cooldown_time;

        const userCooldown: UserCooldown = await this.db
            .selectFrom('user_cooldowns')
            .select(['start_date'])
            .where('user_id', '=', user_id as UsersUserId)
            .where('command_id', '=', command_id as CommandsCommandId)
            .executeTakeFirst() as UserCooldown;

        if (userCooldown) {
            const startDateTime = DateTime.fromISO(userCooldown.start_date);
            if (!startDateTime.isValid) {
                console.error('Invalid start date:', userCooldown.start_date);
                return 0;
            }

            const expirationDateTime = startDateTime.plus({ milliseconds: cooldownAmount });
            const remainingDuration = expirationDateTime.diffNow('millisecond').milliseconds;
            
            if (remainingDuration <= 0) {
                await this.db
                    .deleteFrom('user_cooldowns')
                    .where('user_id', '=', user_id as UsersUserId)
                    .where('command_id', '=', command_id as CommandsCommandId)
                    .execute();
                return 0;
            }

            return remainingDuration;
        }

        return 0; // No cooldown found
    }


    async createCooldown(user_id: string, command_id: string): Promise<void> {
        await this.db
            .insertInto('user_cooldowns')
            .values({
                user_id: user_id as UsersUserId,
                command_id: command_id as CommandsCommandId,
                start_date: DateTime.now().toISO()
            })
            .execute();
    }
    
    constructor(db: Kysely<Database>) {
        super(db, 'users', 'user_id');
    }
}

const users = new Users(db);
export { users as Users };
