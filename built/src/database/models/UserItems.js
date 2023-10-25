module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user_items', {
        item_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            'default': 0,
        }
    }, {
        timestamps: false,
    });
};
