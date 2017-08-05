const github = require('octonode');
const config = require('./config.json');
const client = github.client(config.githubAccessKey);

module.exports = client;
