module.exports = (sequelize, DataTypes) => {
	return sequelize.define('items', {
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
        description: {
            type: DataTypes.STRING
        },
		price: {
			type: DataTypes.INTEGER,
			allowNull: false,
            defaultValue: 0
		},
        icon: {
            type: DataTypes.STRING,
        }
	}, {
		timestamps: false,
	});
};
