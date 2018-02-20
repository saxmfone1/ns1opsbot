async function updater (bot, config, slack, vo) {
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
        slack.post_to_channel(bot, config.channel, message)
    }
    if (update.ok === false && update.message !== "No change required"){
        console.log(update.message);
    }
    else {
        console.log(update.message);
    }
}

module.exports = {
    updater: updater
};