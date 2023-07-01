module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
        activity: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
        last_active_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        }
	}, {
		timestamps: false,
	});
};

