const Botkit = require("botkit");
const fs = require("fs");
const VO = require("./vo");
const Slack = require("./slack");
const updater = require("./updater");

const config = JSON.parse(fs.readFileSync("config.json"));
const slack = new Slack.Slack(config.oauth);
const vo = new VO.VO(config.void, config.votoken);

const controller = Botkit.slackbot({
    debug: false,
    require_delivery: true
});

let bot = controller.spawn({
    token: config.slacktoken
});

require("./conversation")(controller, slack, vo);

bot.startRTM((err,bot,payload) => {
    if (err) {
        throw new Error('Could not connect to Slack');
    }
    updater.updater(bot, config, slack, vo);
    setInterval(() => {
        updater.updater(bot, config, slack, vo);
    }, 10*60*1000)

});