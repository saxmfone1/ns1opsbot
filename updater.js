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

async function updater (bot, config, slack, vo) {
    logger.info("Starting periodic update of oncall users");
    let slack_users = [];
    let vo_users = await vo.get_current_oncall_users();
    for (let user of vo_users) {
        slack_users.push(await vo.lookup_email(user))
    }
    let perm_members = [
        "bross@ns1.com"
    ];
    slack_users = slack_users.concat(perm_members);
    let oncall_handle = "oncall-ny";
    let update = await slack.bulk_group_change_by_email(bot, slack_users, oncall_handle, false);
    if (update.ok === true) {
        let message = update.message + " " + oncall_handle + ": " + slack_users.join(", ");
        try {
            slack.post_to_channel(bot, config.channel, message)
        }
        catch (e){
            logger.error(e);
        }
    }
    if (update.ok === false && update.message !== "No change required"){
        logger.info(update.message);
    }
    else {
        logger.info(update.message);
    }
}

module.exports = {
    updater: updater
};