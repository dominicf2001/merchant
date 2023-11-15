import { Users, Stocks } from './database/db-objects';
import { Users as User } from './database/schemas/public/Users';
import { UserActivities as UserActivity } from './database/schemas/public/UserActivities';
import { DateTime } from 'luxon';

export async function updateStockPrices(): Promise<void> {    
    const allUsers = await Users.getAll();

    await Promise.all(allUsers.map(async user => {
        const activity = await Users.getActivity(user.user_id);
        
        const EMA = calculateEMA(activity);
        const EMSD = calculateEMSD(activity);
        const SMA = activity.activity_points_long_sma; // calculated seperately

        const newPrice = calculateStockPrice(EMA, EMSD, SMA);
        await Stocks.updateStockPrice(user.user_id, newPrice);
        
        // update storage
        await Users.setActivity(user.user_id, {
            activity_points_short: 0,
            activity_points_short_ema: EMA,
            activity_points_short_emsd: EMSD,
            activity_points_long_sma: SMA,
        });
    }));
}

function calculateStockPrice(EMA: number, EMSD: number, SMA: number): number {
    const EMA_WEIGHT = 0.5;
    const EMSD_WEIGHT = 0.3;
    const SMA_WEIGHT = 0.2;
    
    const RANDOMNESS_FACTOR = 0.05;
    const randomAdjustment = (Math.random() - 0.5) * RANDOMNESS_FACTOR;
    
    const newPrice = (EMA * EMA_WEIGHT) + (EMSD * EMSD_WEIGHT) + (SMA * SMA_WEIGHT) + randomAdjustment;

    return newPrice;
}


function calculateEMA(activity: UserActivity): number {
    const SMOOTHING_FACTOR = 0.3;
    
    const oldEMA = activity.activity_points_short_ema;
    const activityPoints = activity.activity_points_short;
    
    return (activityPoints * SMOOTHING_FACTOR) + (oldEMA * (1 - SMOOTHING_FACTOR));
}

function calculateEMSD(activity: UserActivity): number {
    const SMOOTHING_FACTOR = 0.3;
    
    const oldEMSD = activity.activity_points_short_emsd;
    const newEMA = calculateEMA(activity);
    const activityPoints = activity.activity_points_short;

    const deviation = activityPoints - newEMA;
    const squaredDeviation = Math.pow(deviation, 2);
    return (squaredDeviation * SMOOTHING_FACTOR) + (oldEMSD * (1 - SMOOTHING_FACTOR));
}

export function updateSMA(user: User, activity: UserActivity) {
    const maxDays = 7;
    const startDate = DateTime.fromISO(user.created_date);
    const today = DateTime.now();

    const oldSMA = activity.activity_points_long_sma;
    const activityPoints = activity.activity_points_long;
    
    let daysCount = today.diff(startDate, 'days').days + 1;
    daysCount = Math.min(Math.ceil(daysCount), maxDays);

    if (daysCount === 1) {
        return activityPoints;
    } else {
        return ((oldSMA * (daysCount - 1)) + activityPoints) / daysCount;
    }
}

// // TODO: move to a function on Stocks
// async function stockCleanUp() {
//     const distinctDatesAndUsers = await Stocks.findAll({
//         attributes: [
//             [Sequelize.fn('date', Sequelize.col('date')), 'dateOnly'],
//             'user_id'
//         ],
//         group: ['dateOnly', 'user_id'],
//         raw:true
//     });

//     for (let item of distinctDatesAndUsers) {
//         const { user_id, dateOnly } = item;

//         const nextDay = new Date(dateOnly);
//         nextDay.setDate(nextDay.getDate() + 1);

//         const t = await sequelize.transaction();

//         try {
//             const latestStock = await Stocks.findOne({
//                 where: {
//                     user_id,
//                     date: {
//                         [Op.gte]: Sequelize.fn('date', dateOnly),
//                         [Op.lt]: Sequelize.fn('date', nextDay.toISOString())
//                     }
//                 },
//                 order: [['date', 'DESC']],
//                 attributes: ['date'],
//                 transaction: t
//             });

//             if(latestStock){
//                 await Stocks.destroy({
//                     where: {
//                         user_id,
//                         date: {
//                             [Op.gte]: Sequelize.fn('date', dateOnly),
//                             [Op.lt]: Sequelize.fn('date', nextDay.toISOString()),
//                             [Op.ne]: latestStock.date
//                         }
//                     },
//                     transaction: t
//                 });
//             }

//             await t.commit();
//         } catch (error) {
//             await t.rollback();
//             throw error;
//         }
//     }

//     const srcPath = path.join(__dirname, './database/database.sqlite');
//     const destPath = path.join(__dirname, './database/database_backup.sqlite');

//     fs.copyFile(srcPath, destPath, (err) => {
//         if (err) {
//             console.error('Error while creating backup:', err);
//         } else {
//             console.log('Database backup was created successfully.');
//         }
//     });

// }


// module.exports = { calculateAndUpdateStocks, stockCleanUp };
