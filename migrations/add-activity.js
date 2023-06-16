// migrations/xxxx-xx-xx-add-activity-to-users.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users', // name of Source model
      'activity', // name of the key we're adding
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    );
  },
};

