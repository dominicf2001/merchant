import { Users, Stocks } from './database/db-objects';

// New Price = Current Price + (Momentum Factor * Momentum Multiplier) + Activity Impact + Volatility Impact + External Factors − Decay Rate
export async function updateStockPrices(): Promise<void> {
    const BASELINE_ACTIVITY = 50;
    const ACTIVITY_SCALE_FACTOR = 0.1;
    
    const BASELINE_VOLATILITY = 10;
    const VOLATILITY_SCALE_FACTOR = 0.05;
    
    const MOMENTUM_MULTIPLIER = 0.1;
    
    const SMOOTHING_FACTOR = 0.3;
    const DECAY_RATE = .05;
    
    const allUsers = await Users.getAll();

    await Promise.all(allUsers.map(async user => {
        const oldPrice = (await Stocks.getLatestStock(user.user_id)).price;
        const activityPoints = user.activity_points;
        const prevEMA = user.activity_points_ema;
        const prevEMSD = user.activity_points_emsd;

        // calculate new EMA and EMSD
        const newEMA = (activityPoints * SMOOTHING_FACTOR) + (prevEMA * (1 - SMOOTHING_FACTOR));

        const deviation = activityPoints - newEMA;
        const squaredDeviation = Math.pow(deviation, 2);
        const newEMSD = (squaredDeviation * SMOOTHING_FACTOR) + (prevEMSD * (1 - SMOOTHING_FACTOR));

        // calculate momentum
        const momentum = newEMA - prevEMA;
        const momentumImpact = momentum * MOMENTUM_MULTIPLIER;
        
        // calculate impacts
        const activityImpact = ((newEMA - BASELINE_ACTIVITY) / BASELINE_ACTIVITY) * ACTIVITY_SCALE_FACTOR;
        const volatilityImpact = ((newEMSD - BASELINE_VOLATILITY) / BASELINE_VOLATILITY) * VOLATILITY_SCALE_FACTOR;
        const decayImpact = oldPrice * DECAY_RATE;

        // calculate new price - TODO: momentum
        const newPrice = oldPrice + momentumImpact + activityImpact + volatilityImpact - decayImpact;

        // update storage
        await Users.set(user.user_id, {
            activity_points_ema: newEMA,
            activity_points_emsd: newEMSD,
            activity_points: 0
        });

        await Stocks.updateStockPrice(user.user_id, newPrice);
    }));
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

