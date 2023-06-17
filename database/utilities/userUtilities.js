const { Users } = require('../dbObjects.js');
const { Collection } = require('discord.js');

const usersCache = new Collection();

async function addBalance(id, amount) {
    amount = Math.floor(amount);
	const user = usersCache.get(id);

	if (user) {
		user.balance = Number(user.balance) + Number(amount);
		return user.save();
	}

	const newUser = await Users.create({ user_id: id, balance: amount });
	usersCache.set(id, newUser);

	return newUser;
}

async function setBalance(id, amount) {
    amount = Math.floor(amount);
	const user = usersCache.get(id);

	if (user) {
		user.balance = Number(amount);
		return user.save();
	}

	const newUser = await Users.create({ user_id: id, balance: amount });
	usersCache.set(id, newUser);

	return newUser;
}

function getBalance(id) {
	const user = usersCache.get(id);
	return user ? user.balance : 0;
}

function getActivity(id) {
	const user = usersCache.get(id);
	return user ? user.activity : 0;
}

async function addActivity(id, amount) {
	const user = usersCache.get(id);

    if (user) {
        user.activity += Math.round(Number(amount));
        return user.save();
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

module.exports = { setBalance, addBalance, getBalance, getActivity, usersCache, addActivity, setActivity };

