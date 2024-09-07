import { UsersFactory, StocksFactory } from "./database/db-objects";
import { UserActivities as UserActivity } from "./database/schemas/public/UserActivities";
import { DateTime } from "luxon";
import { getRandomFloat, getRandomInt } from "./utilities";

interface RunInstance {
    end: DateTime,
    multiplier: number
}

const runMap = new Map<string, RunInstance>();

const ACTIVITY_DECAY_FACTOR = 0.8;
const PRICE_MOMENTUM_FACTOR = 0.95;
const VOLATILITY_DAMPENING = 0.5;
const MAX_PRICE_CHANGE_PERCENT = 0.05;
const SHORT_TERM_FLUCTUATION_FACTOR = 0.03;

export async function updateStockPrices(guildId: string, date = DateTime.now()): Promise<void> {
    const Users = UsersFactory.get(guildId);
    const Stocks = StocksFactory.get(guildId);

    const allStocks = await Stocks.getAll();
    await Promise.all(
        allStocks.map(async (stock) => {
            const activity = await Users.getActivity(stock.stock_id);
            const EMA = calculateEMA(activity);
            const EMSD = calculateEMSD(activity);
            const SMA = activity.activity_points_long_sma;

            const previousPrice = stock.price;
            let newPrice = calculateStockPrice(EMA, EMSD, SMA, previousPrice);

            // Apply short-term fluctuation
            const fluctuation = (Math.random() - 0.5) * 2 * SHORT_TERM_FLUCTUATION_FACTOR * previousPrice;
            newPrice = newPrice + fluctuation;

            // Limit the maximum price change
            const maxChange = previousPrice * MAX_PRICE_CHANGE_PERCENT;
            newPrice = Math.max(
                Math.min(newPrice, previousPrice + maxChange),
                previousPrice - maxChange
            );

            // Apply short-term bull/bear runs
            if (runMap.has(stock.stock_id)) {
                const runInstance = runMap.get(stock.stock_id);
                if (DateTime.now() > runInstance.end) {
                    runMap.delete(stock.stock_id);
                }
                else {
                    const change = (runInstance.multiplier * newPrice) * (Math.random() - 0.5) * 2;
                    newPrice = newPrice + change;
                }
            }
            else {
                if (Math.random() > .97) {
                    runMap.set(stock.stock_id, {
                        end: DateTime.now().plus({ minutes: getRandomInt(10, 60) }),
                        multiplier: getRandomFloat(.02, .1) * (Math.random() - 0.5)
                    });
                }
            }

            await Stocks.updateStockPrice(stock.stock_id, Math.ceil(Math.round(newPrice * 100) / 100), date);

            const decayedShortActivity = Math.floor(activity.activity_points_short * ACTIVITY_DECAY_FACTOR);
            await Users.setActivity(stock.stock_id, {
                last_activity_date: date.toUTC().toSQL(),
                activity_points_short: decayedShortActivity,
                activity_points_short_ema: EMA < 0 ? 0 : EMA,
                activity_points_short_emsd: EMSD < 0 ? 0 : EMSD,
            });
        }),
    );
}

function calculateStockPrice(EMA: number, EMSD: number, SMA: number, previousPrice: number): number {
    const EMA_WEIGHT = 0.25;
    const EMSD_WEIGHT = 0.15;
    const SMA_WEIGHT = 2.6;
    const RANDOMNESS_FACTOR = 1.5;

    const randomAdjustment = (Math.random() - 0.5) * RANDOMNESS_FACTOR;
    const calculatedPrice =
        EMA * EMA_WEIGHT +
        EMSD * EMSD_WEIGHT +
        SMA * SMA_WEIGHT +
        randomAdjustment;

    const newPrice = previousPrice * PRICE_MOMENTUM_FACTOR + calculatedPrice * (1 - PRICE_MOMENTUM_FACTOR);

    return previousPrice + (newPrice - previousPrice) * VOLATILITY_DAMPENING;
}

function calculateEMA(activity: UserActivity): number {
    const SMOOTHING_FACTOR = 0.2;
    const oldEMA = activity.activity_points_short_ema;
    const activityPoints = activity.activity_points_short;
    return Math.ceil(
        activityPoints * SMOOTHING_FACTOR + oldEMA * (1 - SMOOTHING_FACTOR),
    );
}

function calculateEMSD(activity: UserActivity): number {
    const SMOOTHING_FACTOR = 0.2;
    const oldEMSD = activity.activity_points_short_emsd;
    const newEMA = calculateEMA(activity);
    const activityPoints = activity.activity_points_short;
    const deviation = activityPoints - newEMA;
    const squaredDeviation = Math.pow(deviation, 2);
    return Math.ceil(
        squaredDeviation * SMOOTHING_FACTOR + oldEMSD * (1 - SMOOTHING_FACTOR),
    );
}

export async function updateSMAS(guildId: string, today = DateTime.now()): Promise<void> {
    const Users = UsersFactory.get(guildId);
    const Stocks = StocksFactory.get(guildId);

    const allStocks = await Stocks.getAll();
    await Promise.all(
        allStocks.map(async (stock) => {
            const activity = await Users.getActivity(stock.stock_id);
            const maxIntervals = 10 * 3;
            const startDate = DateTime.fromSQL(activity.first_activity_date);
            const oldSMA = activity.activity_points_long_sma;
            const activityPoints = activity.activity_points_long;
            let intervals = Math.ceil(today.diff(startDate, "days").days) * 3;
            intervals += today.hasSame(startDate, "day") ? 0 : 3;
            const hourOfDay = today.hour;
            if (hourOfDay < 8) intervals += 1;
            else if (hourOfDay < 16) intervals += 2;
            else intervals += 3;
            intervals = Math.min(intervals, maxIntervals);

            const newSMA = intervals === 1
                ? activityPoints
                : Math.ceil((oldSMA * (intervals - 1) + activityPoints) / intervals);

            await Users.setActivity(stock.stock_id, {
                activity_points_long_sma: newSMA,
                activity_points_long: Math.floor(activityPoints * ACTIVITY_DECAY_FACTOR),
            });
        }),
    );
}
