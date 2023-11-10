// const { usersCache, getNetWorth, updateUserRoleLevel } = require("./database/utilities/userUtilities.js");
// const { client } = require("./index.js");
// const { Users } = require("./database/dbObjects.js");
// async function updateRoles() {
//     const topUsers = Array.from(usersCache.values()).sort(async (a, b) =>
//         (await getNetWorth(b.user_id)) - (await getNetWorth(a.user_id)));
//     const totalUsers = topUsers.length;
//     const cutoffs = [1, 2, 4, 8];
//     const totalCutoffs = cutoffs.reduce((a, b) => a + b, 0);
//     const normalizedCutoffs = cutoffs.map(c => c / totalCutoffs);
//     let role;
//     for (let i = 0; i < totalUsers; ++i) {
//         const cachedUser = topUsers[i];
//         if (i / totalUsers < normalizedCutoffs[0]) {
//             role = "Truecel";
//         } else if (i / totalUsers < normalizedCutoffs[0] + normalizedCutoffs[1]) {
//             role = "Incel";
//         } else if (i / totalUsers < normalizedCutoffs[0] + normalizedCutoffs[1] + normalizedCutoffs[2]) {
//             role = "Chud";
//         } else if (i / totalUsers < normalizedCutoffs[0] + normalizedCutoffs[1] + normalizedCutoffs[2] + normalizedCutoffs[3]) {
//             role = "Fakecel";
//         } else {
//             role = "Normie";
//         }
//         const guild = client.guilds.cache.get("991943318093172827");
//         const user = await Users.findOne({ where: { user_id: cachedUser.user_id } });
//         updateUserRoleLevel(guild, user, role);
//     }
// }
// module.exports = { updateRoles };
