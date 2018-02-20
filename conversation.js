module.exports = (controller, slack, vo) => {
    // controller.hears(["^user list$"], ['direct_message'], async (bot, message) => {
    //     try {
    //         let user_list = await slack.print_users(bot);
    //         let reply = "";
    //         for (let user of user_list){
    //             reply += user + "\n";
    //         }
    //         bot.reply(message, reply);
    //     }
    //     catch (err) {
    //         bot.reply(message, "Sorry! Something went wrong: " + err);
    //     }
    // });
    controller.hears(["^slack oncall group list$"], ['direct_message,direct_mention,mention'], async (bot, message) => {
        bot.startTyping(message);
        try {
            let group_list = await slack.print_group_users(bot, 'oncall-ny');
            for (let group in group_list){
                let reply = "@" + group + ":\n";
                for (let user of group_list[group]){
                    reply += "\t" + user + "\n";
                }

                bot.reply(message, reply);
            }
        }
        catch (err) {
            bot.reply(message, "Sorry! Something went wrong: " + err);
        }
    });

    controller.hears(["^(add|remove) (.*) (to|from) oncall$"], ['direct_message,direct_mention,mention'], async (bot, message) => {
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

    // controller.hears(["email (.*)"], ['direct_message'], async (bot, message) => {
    //     let email = message.match[1];
    //     let reply = "";
    //     try {
    //         reply = await slack.lookup_userid_by_email(bot, email);
    //     }
    //     catch (err){
    //         reply = "Could not find user";
    //     }
    //     if (reply === null){
    //         reply = "Could not find user";
    //     }
    //     bot.reply(message, reply);
    // });

    controller.hears(["vo oncall group list"], ['direct_message,direct_mention,mention'], async (bot, message) => {
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
    })
};