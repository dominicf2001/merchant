module.exports = (sequelize, DataTypes) => {
    return sequelize.define('stocks', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        date: {
            type: DataTypes.DATE,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        purchased_shares: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        highest_price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        indexes: [{
            // getting latest stock
            fields: ['user_id', 'date']
        }, {
            // getting entire stock history
            fields: ['user_id']
        }],
        timestamps: false,
    });
};

// not needed for now
/*
async function maintainStockHistoryLimit(stock) {
    const Stocks = stock.sequelize.models.stocks;
    const stockHistories = await Stocks.findAll({
        where: {
            user_id: stock.user_id
        },
        order: [['date', 'ASC']]
    });

    if (stockHistories.length >= 18000) {
        const oldestRecord = stockHistories[0];
        await oldestRecord.destroy();
    }
};
*/

