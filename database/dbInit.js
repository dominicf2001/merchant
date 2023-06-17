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
    const users = await Users.findAll();
    for(let user of users) {
        user.activity = 0;
        await Users.upsert(user);
    }

    const items = [
        Items.upsert({ name: 'mute', price: 200, icon: ":mute:", description: "Mutes a user for 5 minutes.\n```$use mute @target```" }),
		Items.upsert({ name: 'emp', price: 250, icon: ":zap:", description: "Disables Nexxy.\n```$use emp```" }),
		Items.upsert({ name: 'megaphone', price: 300, icon: ":mega:", description: "Sends your message and/or attachment as an @everyone.\n```$use megaphone [message]```" }),
		Items.upsert({ name: 'battery', price: 350, icon: ":battery:", description: "Enables Nexxy.\n```$use battery```" }),
		Items.upsert({ name: 'nametag', price: 500, icon: ":label:", description: "Sets any user's nickname.\n```$use nametag @target [name]```" }),
		Items.upsert({ name: 'joker', price: 1000, icon: ":black_joker:", description: "???" }),
	];
    const stocks = [
        Stocks.upsert({
            user_id: '88300657328558080',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '196024293509824512',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '608852453315837964',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '792546021594628117',
            date: Date.now(),
            price: 125,
        }),
	Stocks.upsert({
            user_id: '252493090529607682',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '410782585627607040',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '418084401889411103',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '364431632037314572',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '1004160134076977182',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '257752713746579457',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '1112339289104187454',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '111616497641660416',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '171015308415467521',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '293518268155822082',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '636976730099154944',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '953795361145757717',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '728960414280319017',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '517805069476036634',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '770216623382069249',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '770216623382069249',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '1085199804432400454',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '808956578396241930',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '579751461945344000',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '124573836590055424',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '198342305227341824',
            date: Date.now(),
            price: 125,
        }),
        Stocks.upsert({
            user_id: '1079629639430979594',
            date: Date.now(),
            price: 125,
        }),
    ]

	await Promise.all([...items, ...stocks]);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);
