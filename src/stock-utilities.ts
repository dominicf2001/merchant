import { Users, Stocks } from "./database/db-objects";
import { StocksCreatedDate } from "./database/schemas/public/Stocks";
import { UserActivities as UserActivity } from "./database/schemas/public/UserActivities";
import { DateTime } from "luxon";

export async function updateStockPrices(date: DateTime = DateTime.now()): Promise<void> {
    const allStocks = await Stocks.getAll();

    await Promise.all(
        allStocks.map(async (stock) => {
            const activity = await Users.getActivity(stock.stock_id);

            const EMA = calculateEMA(activity);
            const EMSD = calculateEMSD(activity);
            const SMA = activity.activity_points_long_sma; // calculated seperately

            const newPrice = calculateStockPrice(EMA, EMSD, SMA);
            await Stocks.updateStockPrice(stock.stock_id, newPrice, date);

            // update storage
            await Users.setActivity(stock.stock_id, {
                last_activity_date: date.toISO(),
                activity_points_short: 0,
                activity_points_short_ema: EMA,
                activity_points_short_emsd: EMSD,
            });
        }),
    );
}

function calculateStockPrice(EMA: number, EMSD: number, SMA: number): number {
    const EMA_WEIGHT = 0.4;
    const EMSD_WEIGHT = 0.2;
    const SMA_WEIGHT = 0.4;

    const RANDOMNESS_FACTOR = 0.15;
    const randomAdjustment = (Math.random() - 0.5) * RANDOMNESS_FACTOR;

    const newPrice =
        EMA * EMA_WEIGHT +
        EMSD * EMSD_WEIGHT +
        SMA * SMA_WEIGHT +
        randomAdjustment;

    return Math.ceil(newPrice);
}

function calculateEMA(activity: UserActivity): number {
    const SMOOTHING_FACTOR = 0.3;

    const oldEMA = activity.activity_points_short_ema;
    const activityPoints = activity.activity_points_short;

    return Math.ceil(
        activityPoints * SMOOTHING_FACTOR + oldEMA * (1 - SMOOTHING_FACTOR),
    );
}

function calculateEMSD(activity: UserActivity): number {
    const SMOOTHING_FACTOR = 0.4;

    const oldEMSD = activity.activity_points_short_emsd;
    const newEMA = calculateEMA(activity);
    const activityPoints = activity.activity_points_short;

    const deviation = activityPoints - newEMA;
    const squaredDeviation = Math.pow(deviation, 2);
    return Math.ceil(
        squaredDeviation * SMOOTHING_FACTOR + oldEMSD * (1 - SMOOTHING_FACTOR),
    );
}

export async function updateSMAS(): Promise<void> {
    const allStocks = await Stocks.getAll();

    await Promise.all(
        allStocks.map(async (stock) => {
            const activity = await Users.getActivity(stock.stock_id);

            const maxIntervals = 7 * 3;
            const startDate = DateTime.fromISO(activity.first_activity_date);
            const today = DateTime.now();

            const oldSMA = activity.activity_points_long_sma;
            const activityPoints = activity.activity_points_long;

            let intervals = Math.ceil(today.diff(startDate, "days").days) * 3;
            intervals += today.hasSame(startDate, "day") ? 0 : 3;

            const hourOfDay = today.hour;
            if (hourOfDay < 8) intervals += 1;
            else if (hourOfDay < 16) intervals += 2;
            else intervals += 3;

            intervals = Math.min(intervals, maxIntervals);

            if (intervals === 1) {
                await Users.setActivity(stock.stock_id, {
                    activity_points_long_sma: activityPoints,
                    activity_points_long: 0,
                });
            } else {
                await Users.setActivity(stock.stock_id, {
                    activity_points_long_sma: Math.ceil(
                        (oldSMA * (intervals - 1) + activityPoints) / intervals,
                    ),
                    activity_points_long: 0,
                });
            }
        }),
    );
}
