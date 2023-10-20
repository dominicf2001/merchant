const { getBalance, getActivity, setActivity } = require("./database/utilities/userUtilities.js");
const { getPortfolioValue, getStockPurchasedShares, setStockPrice, getAllLatestStocks } = require("./database/utilities/stockUtilities.js");
const { getRandomFloat } = require("./utilities.js");
const { getNetWorth } = require("./database/utilities/userUtilities.js");
const fs = require('fs');
const path = require('path');
const { Users, Stocks } = require("./database/dbObjects.js");
const { Op, Sequelize } = require("sequelize");
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
    logging: false,
    storage: './database/database.sqlite'
});

const WEIGHTS = {
    share: 0.02,
    activity: 0.07,
    random: 0.04,
    netWorth: 0.01,
    price: 0.92
};

const BASE_PRICE = 29;
const SCALING_FACTOR = 20;
const DECAY_RATE = 0.006;

function getRandomFactor() {
    const direction = Math.random() < 0.5 ? -1 : 1;
    return getRandomFloat(10, 50) * direction;
}

function calculateDecayedActivity(activity, lastActiveTime) {
    const currentTime = Date.now();
    const timeDifference = currentTime - lastActiveTime;
    const timeDifferenceInHours = timeDifference / 1000 / 60 / 60;

    const decayedActivity = activity * Math.exp(-DECAY_RATE * timeDifferenceInHours);

    return decayedActivity;
}

function calculateAmount(weights, purchasedShares, activity, randomFactor, netWorth, stockPrice, shockFactor) {
    const weightedSum = (
        purchasedShares * weights.share +
        activity +
        randomFactor * weights.random +
        netWorth * weights.netWorth +
        stockPrice * weights.price +
        shockFactor
    );

    const weightedDivisor = (weights.share + weights.activity + weights.random + weights.netWorth + weights.price);

    let amount = BASE_PRICE + weightedSum / weightedDivisor;

    return amount < 0 ? 0 : amount;
}

let shockFactors = {};
let shockIntensities = {};
function getShockFactorForStock(stockId) {
    const chance = Math.random();
    if(shockFactors[stockId] === undefined || shockFactors[stockId] === 0) {
        if(chance < 0.03) {
            console.log("Shock has occured");
            shockFactors[stockId] = getRandomFloat(-13, -2);
            shockIntensities[stockId] = getRandomFloat(0.70, 0.95);
        } else if(chance < 0.05) {
            console.log("Shock has occured");
            shockFactors[stockId] = getRandomFloat(2, 13);
            shockIntensities[stockId] = getRandomFloat(0.70, 0.95);
        } else {
            shockFactors[stockId] = 0;
            shockIntensities[stockId] = 1;
        }
    }
    return shockFactors[stockId];
}

async function calculateAndUpdateStocks(){
    console.log("Recalculating stocks...");
    try {
        const latestStocks = await getAllLatestStocks();
        for (let latestStock of latestStocks) {
            const user = await Users.findOne({
                where: {
                    user_id: latestStock.user_id
                }
            });
            if (!user) continue;

            let activity = getActivity(user.user_id);
            const lastActiveDate = user.last_active_date ? new Date(user.last_active_date) : new Date();
            activity = calculateDecayedActivity(activity, lastActiveDate);

            const netWorth = SCALING_FACTOR * Math.log(1 + (await getNetWorth(user.user_id)));
            const randomFactor = getRandomFactor();
            const purchasedShares = SCALING_FACTOR * Math.log(1 + (await getStockPurchasedShares(user.user_id)));

            let shockFactorForThisStock = getShockFactorForStock(latestStock.id);

            const amount = calculateAmount(WEIGHTS, purchasedShares, activity, randomFactor, netWorth, latestStock.price, shockFactorForThisStock);

            setStockPrice(user.user_id, Math.round(amount));
            setActivity(user.user_id, activity);

            if (shockFactorForThisStock !== 0) {
                shockFactors[latestStock.id] *= shockIntensities[latestStock.id];
                if (Math.abs(shockFactors[latestStock.id]) < 0.01) {
                    shockFactors[latestStock.id] = 0;
                }
            }
        }
        console.log("Finished recalculating stocks.");
    } catch (error) {
        console.error(error);
    }
}

async function stockCleanUp() {
    const distinctDatesAndUsers = await Stocks.findAll({
        attributes: [
            [Sequelize.fn('date', Sequelize.col('date')), 'dateOnly'],
            'user_id'
        ],
        group: ['dateOnly', 'user_id'],
        raw:true
    });

    for (let item of distinctDatesAndUsers) {
        const { user_id, dateOnly } = item;

        const nextDay = new Date(dateOnly);
        nextDay.setDate(nextDay.getDate() + 1);

        const t = await sequelize.transaction();

        try {
            const latestStock = await Stocks.findOne({
                where: {
                    user_id,
                    date: {
                        [Op.gte]: Sequelize.fn('date', dateOnly),
                        [Op.lt]: Sequelize.fn('date', nextDay.toISOString())
                    }
                },
                order: [['date', 'DESC']],
                attributes: ['date'],
                transaction: t
            });

            if(latestStock){
                await Stocks.destroy({
                    where: {
                        user_id,
                        date: {
                            [Op.gte]: Sequelize.fn('date', dateOnly),
                            [Op.lt]: Sequelize.fn('date', nextDay.toISOString()),
                            [Op.ne]: latestStock.date
                        }
                    },
                    transaction: t
                });
            }

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    const srcPath = path.join(__dirname, './database/database.sqlite');
    const destPath = path.join(__dirname, './database/database_backup.sqlite');

    fs.copyFile(srcPath, destPath, (err) => {
        if (err) {
            console.error('Error while creating backup:', err);
        } else {
            console.log('Database backup was created successfully.');
        }
    });

}


module.exports = { calculateAndUpdateStocks, stockCleanUp };

