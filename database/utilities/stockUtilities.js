const { Collection } = require("discord.js");
const { Op, fn, col, Sequelize } = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './database/database.sqlite'
});
const { Stocks, UserStocks } = require("../dbObjects.js");

const latestStocksCache = new Collection();

async function getPortfolioValue(id){
    const portfolio = await getPortfolio(id);

    let totalValue = 0;
    for (const stockId in portfolio){
        const stock = portfolio[stockId];
        totalValue += Number(stock.total_purchase_price) + Number(stock.gainOrLoss);
    }
    return Math.floor(totalValue);
}

async function getPortfolio(id) {
    try {
        const userStocks = await UserStocks.findAll({
            where: { user_id: id }
        });

        const portfolio = {};

        for (const userStock of userStocks) {
            const latestStock = await getLatestStock(userStock.stock_user_id);

            if (!portfolio[userStock.stock_user_id]) {
                portfolio[userStock.stock_user_id] = {
                    total_shares: 0,
                    total_purchase_price: 0,
                    current_price: latestStock.price
                };
            }

            portfolio[userStock.stock_user_id].total_shares += userStock.shares;
            portfolio[userStock.stock_user_id].total_purchase_price += userStock.purchase_price * userStock.shares;
        }

        for (let stockUserId in portfolio) {
            const stock = portfolio[stockUserId];

            const totalCurrentValue = stock.total_shares * stock.current_price;

            const gainOrLoss = totalCurrentValue - stock.total_purchase_price;

            stock.gainOrLoss = gainOrLoss;
        }

        return portfolio;
    } catch (error) {
        console.error(error);
    }
}

async function getStockPurchasedShares(id){
    try {
        let sum = await UserStocks.sum('shares', {
            where: {
                stock_user_id: id
            }
        });

        if (!sum) sum = 0;

        return sum;
    } catch (error) {
        console.error('Error while calculating the shares sum:', error);
    }
}

async function getPortfolioStock(userId, stockId, page=1) {
    const offset = (page - 1) * 5;
    return await UserStocks.findAll({
        where: { user_id: userId, stock_user_id: stockId },
        order: [
            ['purchase_date', 'DESC']
        ],
        offset: offset,
        limit: 5
    });
}

async function setStockPrice(id, price) {
    try {
        const stock = await getLatestStock(id);
        if (!stock) {
            throw new Error("This stock does not exist.");
        }

        const newStock = await Stocks.create({
            user_id: id,
            price: +price,
            purchased_shares: +stock.purchased_shares,
            highest_price: +price > +stock.highest_price ? +price : +stock.highest_price
        });
        latestStocksCache.set(id, newStock);
        return newStock;
    } catch (error) {
        console.error("Error setting stock price: ", error);
    }
};

async function getLatestStock(id) {
    try {
        return latestStocksCache.get(id);
    } catch (error) {
        console.error("Error getting latest stock: ", error);
    }
};

async function getAllLatestStocks() {
    try {
        const stocks = await sequelize.query(`
            SELECT s1.*
            FROM stocks s1
            JOIN (
                SELECT user_id, MAX(date) AS max_date
                FROM stocks
                GROUP BY user_id
            ) s2 ON s1.user_id = s2.user_id AND s1.date = s2.max_date
            ORDER BY s1.date DESC
            `, { type: sequelize.QueryTypes.SELECT });
        return stocks;
    } catch (error) {
        console.error("Error getting all latest stocks: ", error);
    }
};

async function getStockHistory(id, interval) {
    try {
        let stockHistory;

        switch(interval) {
            case 'hour':
                stockHistory = await Stocks.findAll({
                    attributes: [
                        'user_id',
                        [fn('strftime', '%Y-%m-%d %H:00', col('date')), 'hour'],
                        'price',
                        'purchased_shares',
                        'highest_price'
                    ],
                    where: {
                        user_id: id
                    },
                    group: ['hour', 'user_id'],
                    order: [
                        ['hour', 'DESC']
                    ],
                    limit: 24,
                    subQuery: false
                });
                break;
            case 'day':
                const maxDayDates = await Stocks.findAll({
                    attributes: [
                        [fn('strftime', '%Y-%m-%d', col('date')), 'day'],
                        [fn('max', col('date')), 'max_date']
                    ],
                    where: {
                        user_id: id
                    },
                    group: ['day'],
                    raw: true
                });

                const days = maxDayDates.map(date => date.day);
                const dayDates = maxDayDates.map(date => date.max_date);

                stockHistory = await Stocks.findAll({
                    attributes: [
                        'user_id',
                        [fn('strftime', '%Y-%m-%d', col('date')), 'day'],
                        'price',
                        'purchased_shares',
                        'highest_price'
                    ],
                    where: {
                        user_id: id,
                        [Op.and]: [
                            sequelize.where(fn('strftime', '%Y-%m-%d', col('date')), { [Op.in]: days }),
                            { date: { [Op.in]: dayDates } }
                        ]
                    },
                    group: ['day', 'user_id'],
                    order: [
                        ['day', 'DESC']
                    ],
                    limit: 30,
                    subQuery: false
                });
                break;
            case 'month':
                const maxMonthDates = await Stocks.findAll({
                    attributes: [
                        [fn('strftime', '%Y-%m', col('date')), 'month'],
                        [fn('max', col('date')), 'max_date']
                    ],
                    where: {
                        user_id: id
                    },
                    group: ['month'],
                    raw: true
                });

                const months = maxMonthDates.map(date => date.month);
                const monthDates = maxMonthDates.map(date => date.max_date);

                stockHistory = await Stocks.findAll({
                    attributes: [
                        'user_id',
                        [fn('strftime', '%Y-%m', col('date')), 'month'],
                        'price',
                        'purchased_shares',
                        'highest_price'
                    ],
                    where: {
                        user_id: id,
                        [Op.and]: [
                            sequelize.where(fn('strftime', '%Y-%m', col('date')), { [Op.in]: months }),
                            { date: { [Op.in]: monthDates } }
                        ]
                    },
                    group: ['month', 'user_id'],
                    order: [
                        ['month', 'DESC']
                    ],
                    subQuery: false
                });
                break;
            default:
                stockHistory = await Stocks.findAll({
                    where: {
                        user_id: id
                    },
                    order: [
                        ['date', 'DESC']
                    ],
                });
        }
        return stockHistory;
    } catch (error) {
        console.error(`Error getting stock history: ${error}`);
    }
};

module.exports = { setStockPrice, getLatestStock, getStockHistory, getStockPurchasedShares, latestStocksCache, getAllLatestStocks, getPortfolio, getPortfolioStock, getPortfolioValue };
