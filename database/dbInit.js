const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './database.sqlite'
});

const Items = require('./models/Items.js')(sequelize, Sequelize.DataTypes);
const Stocks = require('./models/Stocks.js')(sequelize, Sequelize.DataTypes);
const UserStocks = require('./models/UserStocks.js')(sequelize, Sequelize.DataTypes);
const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
require('./models/UserCooldowns.js')(sequelize, Sequelize.DataTypes);
const faker = require('faker');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
    const items = [
        Items.upsert({ name: 'mute', price: 400, icon: ":mute:", description: "Mutes a user for 5 minutes.\n```$use mute @target```" }),
		Items.upsert({ name: 'emp', price: 250, icon: ":zap:", description: "Disables Nexxy.\n```$use emp```" }),
		Items.upsert({ name: 'megaphone', price: 600, icon: ":mega:", description: "Sends your message and/or attachment as an @everyone.\n```$use megaphone [message]```" }),
		Items.upsert({ name: 'battery', price: 350, icon: ":battery:", description: "Enables Nexxy.\n```$use battery```" }),
		Items.upsert({ name: 'nametag', price: 500, icon: ":label:", description: "Sets any user's nickname.\n```$use nametag @target [name]```" }),
		Items.upsert({ name: 'joker', price: 4000, icon: ":black_joker:", description: "???" }),
	];

    	await Promise.all([...items]);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);
