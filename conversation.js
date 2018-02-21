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
logger.level = 'info';

module.exports = (controller, slack, vo) => {
    controller.hears(["thanks"], ['direct_message, direct_mention,mention'], async (bot, message) => {
        logger.info("[" + await slack.get_username(bot, message.user) + "] " + message.match[0]);
        bot.replyWithTyping(message, "Very good, sir.");
    });

    controller.hears(["^slack oncall group list$"], ['direct_message,direct_mention,mention'], async (bot, message) => {
        logger.info("[" + await slack.get_username(bot, message.user) + "] " + message.match[0]);
        bot.startTyping(message);
        try {
            let group_list = await slack.print_group_users(bot, 'oncall-ny');
            for (let group in group_list){
                if (group_list.hasOwnProperty(group)) {
                    let reply = "@" + group + ":\n";
                    for (let user of group_list[group]) {
                        reply += "\t" + user + "\n";
                    }
                    bot.reply(message, reply);
                }
            }
        }
        catch (err) {
            bot.reply(message, "Sorry! Something went wrong: " + err);
        }
    });

    controller.hears(["^(add|remove) (.*) (to|from) oncall$"], ['direct_message,direct_mention,mention'], async (bot, message) => {
        logger.info("[" + await slack.get_username(bot, message.user) + "] " + message.match[0]);
        bot.startTyping(message);
        let action = message.match[1];
        let user = message.match[2];
        let group = 'oncall-ny';
        let reply = "";
        try {
            reply = await slack.single_user_group_change(bot, user, group, action);
        }
        catch (err) {
            reply = "Something went wrong: " + err;
        }
        bot.reply(message, reply)
    });

    controller.hears(["who is on call"], ['direct_message,direct_mention,mention'], async (bot, message) => {
        logger.info("[" + await slack.get_username(bot, message.user) + "] " + message.match[0]);
        bot.startTyping(message);
        let users, reply;
        try {
            users = await vo.get_current_oncall_users();
        }
        catch (err){
            reply = "Unable to fetch users from VO: " + err;
            bot.reply(message, reply);
            return;
        }
        reply =  "VictorOps reports the following users are currently oncall:\n";
        for (let user of users){
            reply += "\t" + user + " (" + await vo.lookup_email(user) + ")\n";
        }
        bot.reply(message, reply);
    });

    controller.hears([".*"], ['direct_message,direct_mention,mention'], async (bot, message) => {
        logger.info("[" + await slack.get_username(bot, message.user) + "] " + message.match[0]);
        bot.replyWithTyping(message, "I didn't quite understand you.\n" +
            "Right now, you can ask me...\n" +
            "`Who is on call?`\n" +
            "`Add/Remove $user to/from oncall` - Note: This only affects the @oncall-ny Slack group, VO will not be changed...yet");
    })
};