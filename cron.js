const { getBalance, getActivity, setActivity } = require("./database/utilities/userUtilities.js");
const { getPortfolioValue, getStockPurchasedShares, setStockPrice, getAllLatestStocks } = require("./database/utilities/stockUtilities.js");
const { getRandomFloat } = require("./utilities.js");
const { getLatestStock } = require("./database/utilities/stockUtilities.js");
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

async function calculateAndUpdateStocks(interval='default'){
    console.log("Recalculating stocks...");

    const shareWeight = 0.025;
    const activityWeight = 0.185;
    const randomWeight = 0.025;
    const netWorthWeight = 0.01;
    const priceWeight = 0.825;

    const activityDecay = (interval == '5min') ? getRandomFloat(.055, .080) : getRandomFloat(.15, .40);

    try {
        const latestStocks = await getAllLatestStocks();
        for (let latestStock of latestStocks) {
            const user = await Users.findOne({
                where: {
                    user_id: latestStock.user_id
                }
            });
            if (!user) continue;

            const portfolioValue = await getPortfolioValue(user.user_id);
            const balance = getBalance(user.user_id);
            const netWorth = portfolioValue + balance;
            let randomDirection = Math.random() < 0.5 ? -1 : 1;
            let randomFactor = getRandomFloat(10, 30) * randomDirection;
            let activity = getActivity(user.user_id);
            const stockPrice = latestStock.price;
            const purchasedShares = 2 * (await getStockPurchasedShares(user.user_id));

            activity *= (1 - activityDecay);

            const basePrice = 33;

            const amount = basePrice + ((purchasedShares * shareWeight + activity * activityWeight + randomFactor * randomWeight + netWorth * netWorthWeight + stockPrice * priceWeight) / (shareWeight + activityWeight + randomWeight + netWorthWeight + priceWeight));

            if (amount < 0) amount = 0;

            setStockPrice(user.user_id, Math.round(amount));
            setActivity(user.user_id, activity);
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

