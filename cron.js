const { getBalance, getActivity, setActivity } = require("./database/utilities/userUtilities.js");
const { getPortfolioValue, getStockPurchasedShares, setStockPrice, getAllLatestStocks } = require("./database/utilities/stockUtilities.js");
const { getRandomFloat } = require("./utilities.js");
const { getLatestStock } = require("./database/utilities/stockUtilities.js");
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

    const activityDecay = (interval == '5min') ? getRandomFloat(.055, .070) : getRandomFloat(.15, .40);

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
            const randomFactor = getRandomFloat(10, 20);
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
    const stocks = await Stocks.findAll({
        attributes: ['user_id'],
        group: 'user_id'
    });

    for (let stock of stocks) {
        const today = new Date().toISOString().slice(0, 10);
        const latestStock = getLatestStock(stock.user_id);
        const latestStockDateTime = latestStock.date;
        const t = await sequelize.transaction();

        try {
            await Stocks.destroy({
                where: {
                    user_id: stock.user_id,
                    date: {
                      [Op.gte]: `${today} 00:00:00`,
                      [Op.lt]: latestStockDateTime,
                    }
                },
                transaction: t,
            });
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = { calculateAndUpdateStocks, stockCleanUp };

