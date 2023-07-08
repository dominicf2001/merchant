const { Users } = require('../dbObjects.js');
const { Collection } = require('discord.js');
const { getPortfolioValue } = require("./stockUtilities.js");

const usersCache = new Collection();

async function addBalance(id, amount, t) {
    amount = Number(amount);
    const user = usersCache.get(id);

    if (user) {
        user.balance = Number(user.balance) + amount;
        return t ? user.save({ transaction: t }) : user.save();
    }

    const newUser = await (t ? Users.create({ user_id: id, balance: amount }, { transaction: t }) : Users.create({ user_id: id, balance: amount }));
    usersCache.set(id, newUser);

    return newUser;
}

async function setBalance(id, amount) {
    amount = Number(amount);
	const user = usersCache.get(id);

	if (user) {
		user.balance = amount;
		return user.save();
	}

	const newUser = await Users.create({ user_id: id, balance: amount });
	usersCache.set(id, newUser);

	return newUser;
}

function getBalance(id) {
	const user = usersCache.get(id);
    user.balance = Math.floor(user.balance);
	return user ? user.balance : 0;
}


async function getNetWorth(userId) {
    const portfolioValue = await getPortfolioValue(userId);
    const balance = getBalance(userId);
    return portfolioValue + balance;
}

function getActivity(id) {
	const user = usersCache.get(id);
	return user ? user.activity : 0;
}

async function addActivity(id, amount) {
    const user = usersCache.get(id);

    if (user) {
        const now = new Date();
        user.activity += Math.round(Number(amount));
        user.last_active_date = now.toISOString();
        return user.save({ fields: ['activity', 'last_active_date'] });
    }

    const newUser = await Users.create({ user_id: id, activity: amount });
    usersCache.set(id, newUser);

    return newUser;
}

async function setActivity(id, amount) {
	const user = usersCache.get(id);

    if (user) {
        user.activity = Number(amount);
        return user.save();
    }

    const newUser = await Users.create({ user_id: id, activity: amount });
    usersCache.set(id, newUser);

    return newUser;
}

module.exports = { setBalance, addBalance, getBalance, getActivity, usersCache, addActivity, setActivity, getNetWorth };

