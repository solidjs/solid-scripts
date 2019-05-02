const chalk = require('react-dev-utils/chalk');

module.exports = (...args) => {
  console.log(chalk.yellow('test coming soon'), ...args);
}