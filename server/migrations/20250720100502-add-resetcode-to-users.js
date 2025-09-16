'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'resetCode', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('users', 'resetCodeExpires', {
      type: Sequelize.DATE,
      allowNull: true
    })
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('users', 'resetCode')
    await queryInterface.removeColumn('users', 'resetCodeExpires')
  }
};
