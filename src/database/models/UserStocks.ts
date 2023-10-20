module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user_stocks', {
        portfolio_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        stock_user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        purchase_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        shares: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        purchase_price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        indexes: [{
            // getting a user's portfolio
            fields: ['user_id']
        }, {
            // getting all purchases of a specific stock
            fields: ['user_id', 'stock_user_id', 'purchase_date']
        }],
        timestamps: false,
    });
};

