const { getBalance, getActivity, setActivity } = require("./database/utilities/userUtilities.js");
const { getPortfolioValue, getStockPurchasedShares, setStockPrice, getAllLatestStocks } = require("./database/utilities/stockUtilities.js");
const { getRandomFloat } = require("./utilities.js");
const { Users } = require("./database/dbObjects.js");

async function calculateAndUpdateStocks(){
    console.log("running");
    const shareWeight = 0.05;
    const activityWeight = 0.26;
    const randomWeight = 0.02;
    const netWorthWeight = 0.02;
    const priceWeight = 0.65;

    const activityDecay = getRandomFloat(.05, .40);

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
            const randomFactor = getRandomFloat(1, 100);
            let activity = getActivity(user.user_id);
            const stockPrice = latestStock.price;
            const purchasedShares = await getStockPurchasedShares(user.user_id);

            activity *= (1 - activityDecay);

            const basePrice = 25;

            const amount = basePrice + ((purchasedShares * shareWeight + activity * activityWeight + randomFactor * randomWeight + netWorth * netWorthWeight + stockPrice * priceWeight) / (shareWeight + activityWeight + randomWeight + netWorthWeight + priceWeight));
            console.log(amount);

            if (amount < 0) amount = 0;

            setStockPrice(user.user_id, Math.round(amount));
            setActivity(user.user_id, activity);
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { calculateAndUpdateStocks };

