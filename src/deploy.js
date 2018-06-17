#!/usr/bin/env node

const path = require("path");

const execa = require("execa");
const yargs = require("yargs");
const ora = require('ora');
const chalk = require('chalk');
const splash = require('./splash');

const tunnelNowPath = path.resolve(__dirname, "..");


const run = (...cmd) => {
  const [ cmdName, ...args ] = cmd;
  return execa(cmdName, args, { cwd: tunnelNowPath });
  if (opts.echo) {
    p.stdout.pipe(process.stdout);
    p.stderr.pipe(process.stderr);
  }
  return p;
};

const main = async () => {
  let { _: [ alias ], token } = yargs
    .usage('tunnel.deploy [alias] [--token key]')
    .help()
    .argv;

  splash();

  const totalSteps = alias ? 2 : 1;
  const logger = ora(`${chalk.dim(`[1/${totalSteps}] -`)} Deploying instance`).start();

  const deployArgs = ["now", "deploy"]
    .concat(token ? ["-e", `TUNNEL_TOKEN=${token}`] : []);
  const { stdout: deployedUrl } = await run.apply(null, deployArgs);
  const hostname = deployedUrl.replace(/https?:\/\//, "");
  logger.succeed(`Deployed tunnel.now instance on ${hostname}`);
  if (alias) {
    logger.start(`${chalk.dim(`[2/${totalSteps}] -`)} Setting instance alias "${alias}"`);
    const { stdout: message } = await run("now", "alias", "set", hostname, alias);
    const aliasHostname = message.match(/Success! (.*) now points/)[1];
    logger.succeed(`Pointing ${chalk.underline(aliasHostname)} to ${chalk.underline(hostname)}`);
  }
  console.log(chalk.default.dim(`\n  Tunnel Usage:\n   \`tunnel.now ${alias ? alias : hostname} <local-port>${token ? ` --token ${token}` : ''}\``));
};

main().catch(err => {
  ora().fail(err);
  process.exit(1);
});
