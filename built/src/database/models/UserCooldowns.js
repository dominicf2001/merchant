module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user_cooldowns', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        command_name: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        timestamp: {
            type: DataTypes.BIGINT,
            allowNull: false,
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'command_name']
            }
        ]
    });
};
