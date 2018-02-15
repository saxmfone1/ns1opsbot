const Botkit = require("botkit");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json"));
const controller = Botkit.slackbot({
    debug: false,
    require_delivery: true
});
const Scim = require("./scim");
const scim = new Scim.Scim(config.oauth);

controller.hears(["^user list$"], ['direct_message'], async (bot, message) => {
    try {
        let user_list = await scim.list_users();
        let reply = "";
        for (let user of user_list){
            reply += await scim.get_username(user) + "\n";
        }
        bot.reply(message, reply);
    }
    catch (err) {
        bot.reply(message, "Sorry! Something went wrong: " + err);
    }
});

controller.hears(["^group list$"], ['direct_message'], async (bot, message) => {
    try {
        let group_list = await scim.list_groups();
        for (let group in group_list){
            let reply = await scim.get_groupname(group) + ":\n";
            for (let user of group_list[group]){
                reply += "\t" + await scim.get_username(user["value"]) + "\n";
            }

            bot.reply(message, reply);
        }
    }
    catch (err) {
        bot.reply(message, "Sorry! Something went wrong: " + err);
    }
});

controller.hears(["^(add|remove) (.*) (to|from) (.*)$"], ['direct_message'], async (bot, message) => {
    let action = message.match[1];
    let user = message.match[2];
    let group = message.match[4];
    try {
        await scim.group_change(user, group, action);
    }
    catch (err) {
        console.log(err);
    }
    bot.reply(message, "Done! Type `group list` to view the new groups")
});

let bot = controller.spawn({
    token: config.slacktoken
});
bot.startRTM((err,bot,payload) => {
    if (err) {
        throw new Error('Could not connect to Slack');
    }

});

