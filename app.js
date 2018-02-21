const Botkit = require("botkit");
const fs = require("fs");
const VO = require("./vo");
const Slack = require("./slack");
const updater = require("./updater");

const config = JSON.parse(fs.readFileSync("config.json"));
const slack = new Slack.Slack(config.oauth);
const vo = new VO.VO(config.void, config.votoken);


const winston = require('winston');
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = new (winston.Logger)({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
        })
    ]
});
logger.level = 'warning';

const controller = Botkit.slackbot({
    debug: false,
    require_delivery: true,
    logger: logger
});

let bot = controller.spawn({
    token: config.slacktoken
});

require("./conversation")(controller, slack, vo);

bot.startRTM((err,bot,payload) => {
    if (err) {
        throw new Error('Could not connect to Slack');
    }
    let teams = config.teams;
    updater.updater(bot, config, slack, vo, teams);
    setInterval(() => {
        updater.updater(bot, config, slack, vo, teams);
    }, 10*60*1000)

});