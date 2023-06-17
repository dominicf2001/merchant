const { getBalance, getActivity, setActivity } = require("./database/utilities/userUtilities.js");
const { getPortfolioValue, getLatestStock, setStockPrice } = require("./database/utilities/stockUtilities.js");
const { getRandomFloat } = require("./utilities.js");
const { Users } = require("./database/dbObjects.js");

async function calculateAndUpdateStocks(){
    const shareWeight = 0.01;
    const activityWeight = 0.21;
    const randomWeight = 0.05;
    const netWorthWeight = 0.03;
    const priceWeight = 0.70;

    const activityDecay = 0.02;

    const users = await Users.findAll();
    for (let user of users) {
	console.log(user);
        const portfolioValue = await getPortfolioValue(user.dataValues.user_id);
        const balance = getBalance(user.dataValues.user_id);
        const netWorth = portfolioValue + balance;
        const randomFactor = getRandomFloat(1, 50);
        let activity = getActivity(user.dataValues.user_id);
        const latestStock = await getLatestStock(user.dataValues.user_id);
        const stockPrice = latestStock.price;
        const purchasedShares = latestStock.purchased_shares;

        activity *= (1 - activityDecay);

        const basePrice = 25;

        const amount = basePrice + ((purchasedShares * shareWeight + activity * activityWeight + randomFactor * randomWeight + netWorth * netWorthWeight + stockPrice * priceWeight) / (shareWeight + activityWeight + randomWeight + netWorthWeight + priceWeight));
        console.log(amount);

        if (amount < 0) amount = 0;

        setStockPrice(user.dataValues.user_id, Math.round(amount));
        setActivity(user.dataValues.user_id, activity);
    }
}

module.exports = { calculateAndUpdateStocks };

