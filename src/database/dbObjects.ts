const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './database/database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const UserCooldowns = require('./models/UserCooldowns.js')(sequelize, Sequelize.DataTypes);

const Items = require('./models/Items.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);

const Stocks = require('./models/Stocks.js')(sequelize, Sequelize.DataTypes);
const UserStocks = require('./models/UserStocks.js')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(Items, { foreignKey: 'item_id', as: 'item' });

UserStocks.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });
UserStocks.belongsTo(Stocks, { foreignKey: 'stock_user_id', as: 'stock' });
Users.hasMany(UserStocks, { foreignKey: 'user_id' });
Stocks.hasMany(UserStocks, { foreignKey: 'stock_user_id' });

// direct queries, no cache. (UserItems). Should eventually make a cache, and put functions in utilities file
Reflect.defineProperty(Users.prototype, 'addItem', {
	value: async function(item) {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		if (userItem) {
			userItem.quantity += 1;
			return userItem.save();
		}

		return UserItems.create({ user_id: this.user_id, item_id: item.id, quantity: 1 });
	},
});

Reflect.defineProperty(Users.prototype, 'removeItem', {
	value: async function(item) {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		if (userItem) {
			userItem.quantity -= 1;
            if (userItem.quantity <= 0) {
                return userItem.destroy();
            } else {
			    return userItem.save();
            }
		}
	},
});

Reflect.defineProperty(Users.prototype, 'getItems', {
	value: function() {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

Reflect.defineProperty(Users.prototype, 'getItem', {
	value: function(itemName) {
		return UserItems.findOne({
			where: {
				user_id: this.user_id,
				'$item.name$': itemName
			},
			include: [{
				model: Items,
				as: 'item',
			}],
		});
	},
});

module.exports = { Users, Items, UserItems, UserCooldowns, Stocks, UserStocks };

