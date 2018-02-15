const Botkit = require("botkit");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json"));
const controller = Botkit.slackbot({
    debug: false,
    require_delivery: true
});
const Scim = require("Scim");
const scim = new Scim();

controller.hears([".*"], ['direct_message'], function(bot, message) {
    bot.reply(message, "Got it!");
    bot.api.groups.list((err, res) => {
        console.log(err);
        console.log(res);
    })
});

let bot = controller.spawn({
    token: config.slacktoken
});
bot.startRTM((err,bot,payload) => {
    if (err) {
        throw new Error('Could not connect to Slack');
    }

});

