const path = require('node:path');
const fs = require('node:fs');
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

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
    const itemsPath = path.resolve(__dirname, '..', 'items');
    const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
    for (const file of itemFiles) {
        const filePath = path.join(itemsPath, file);
        const item = require(filePath);
        if ('data' in item && 'use' in item) {
            await Items.upsert(item.data);
        } else {
            console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
        }
    }

    console.log('Database synced');

	sequelize.close();
}).catch(console.error);
