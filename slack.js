const map = Array.prototype.map;

function compare_arrays(array1, array2){
    if (array1.length !== array2.length){
        return false;
    }
    for (let item of array1){
        if (!array2.includes(item)){
            return false;
        }
    }
    return true;
}

function parse_mailto(email_string){
    let email = "";
    let email_match_string = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let mailto_match_string = /<mailto:.*\|(.*)>/;
    let matches = mailto_match_string.exec(email_string);
    if (email_match_string.exec(email_string) !== null){
        email = email_string;
    }
    else if (matches !== null){
        email = matches[1];
    }
    else {
        email = null;
    }
    return email;
}

function lookup_username(userid, user_data){
    let username = null;
    for (let user of user_data["members"]){
        if (user.id === userid){
            username = user.name;
        }
    }
    return username;
}

function lookup_userid_by_username(username, user_data){
    let userid = null;
    for (let user of user_data["members"]){
        if (user.name === username){
            userid = user.id;
        }
    }
    return userid;
}

// function lookup_username_by_email(email, user_data){
//     let username = null;
//     for (let user of user_data["members"]){
//         if (user.profile.email === email){
//             username = user.name;
//         }
//     }
//     return username;
// }

function lookup_group_handle(groupid, group_data){
    let groupname = null;
    for (let group of group_data["usergroups"]){
        if (group.id === groupid){
            groupname = group.handle;
        }
    }
    return groupname;
}

function lookup_groupid_by_handle(group_handle, group_data){
    let groupid = null;
    for (let group of group_data["usergroups"]){
        if (group.handle === group_handle){
            groupid = group.id;
        }
    }
    return groupid;
}

function user_group_check(userid, groups_user_data){
    return groups_user_data.users.includes(userid);
}

class Slack {
    constructor (oauth_token, bot_token){
        this.token = oauth_token;
        this.bot_token = bot_token;
    }

    async get_group_data(bot){
        return await new Promise((resolve, reject) => {
            bot.api.usergroups.list({token: this.token}, (err, res) => {
                if (err){
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
    }

    async get_user_data(bot){
        return await new Promise((resolve, reject) => {
            bot.api.users.list({token: this.token}, (err, res) => {
                if (err){
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
    }

    async lookup_userid_by_email(bot, email){
        email = parse_mailto(email);
        let userid = null;
        if (email !== null) {
            let user_data = await this.get_user_data(bot);
            for (let user of user_data.members) {
                if (user.profile.email === email) {
                    userid = user.id;
                    break;
                }
            }
        }
        return userid;
    }

    async get_username(bot, userid){
        let user_data = await this.get_user_data(bot);
        return lookup_username(userid, user_data);
    }

    async get_groups_user_data(bot, usergroup){
        return await new Promise((resolve, reject) => {
            bot.api.usergroups.users.list({token: this.token, usergroup: usergroup}, (err, res) => {
                if (err){
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
    }

    async update_groups_user_data(bot, usergroup, users){
        return await new Promise((resolve, reject) => {
            bot.api.usergroups.users.update({token: this.token, usergroup: usergroup, users: users}, (err, res) => {
                if (err){
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
    }

    async post_to_channel(bot, channel, text){
        return await new Promise ((resolve, reject) => {
            let payload = {
                token: this.bot_token,
                channel: channel,
                text: text
            };
            bot.api.chat.postMessage(payload, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
    }

    async list_groups(bot){
        let group_data = await this.get_group_data(bot);
        let group_list = [];
        for (let group of group_data["usergroups"]){
            group_list.push(group.id)
        }
        return group_list;
    }

    async list_group_users(bot){
        let groups = await this.list_groups(bot);
        let group_users = {};
        for (let group of groups){
            let group_user_data = await this.get_groups_user_data(bot, group);
            group_users[group] = group_user_data.users;
        }
        return group_users;
    }

    async print_group_users(bot, group_handle){
        let user_data = await this.get_user_data(bot);
        let group_data = await this.get_group_data(bot);
        // let groups = await this.list_groups(bot);
        let group_id = lookup_groupid_by_handle(group_handle, group_data);
        let groups = [group_id];
        let group_users = {};
        for (let group of groups){
            let group_user_data = await this.get_groups_user_data(bot, group);
            group_users[lookup_group_handle(group, group_data)] = map.call(group_user_data.users, (userid) => {
                return lookup_username(userid, user_data);
            });
        }
        return group_users;
    }

    async list_users(bot){
        let user_data = await this.get_user_data(bot);
        let user_list = [];
        for (let user of user_data["members"]){
            user_list.push(user.id);
        }
        return user_list;
    }

    async print_users(bot){
        let user_data = await this.get_user_data(bot);
        let user_list = [];
        for (let user of user_data["members"]){
            user_list.push(lookup_username(user.id, user_data));
        }
        return user_list;
    }

    async single_user_group_change(bot, username, group_handle, action){
        let reply = "";
        let user_data = await this.get_user_data(bot);
        let group_data = await this.get_group_data(bot);
        let userid = lookup_userid_by_username(username, user_data);
        let group_id = lookup_groupid_by_handle(group_handle, group_data);
        if (userid !== null && group_id !== null) {
            let groups_user_data = await this.get_groups_user_data(bot, group_id);
            let user_present = user_group_check(userid, groups_user_data);
            let members = groups_user_data.users;
            switch (action) {
                case "add":
                    if (user_present) {
                        reply = "User already present in group";
                        break;
                    }
                    else {
                        members.push(userid);
                        try {
                            await this.update_groups_user_data(bot, group_id, members.join());
                            reply = "User has been added to the group";
                        }
                        catch (err){
                            reply = err;
                        }
                        break;
                    }
                case "remove":
                    if (user_present) {
                        let member = members.indexOf(userid);
                        if (member > -1) {
                            members.splice(member, 1);
                        }
                        try {
                            await this.update_groups_user_data(bot, group_id, members.join());
                            reply = "User has been removed from the group";
                        }
                        catch (err){
                            reply = err;
                        }
                        break;
                    }
                    else {
                        reply = "User is not in the group";
                        break;
                    }
                default:
                    reply = "Thats not a thing!";
                    break;
            }
        }
        else {
            if (userid === null) {
                reply += "The username is invalid\n";
            }
            if (group_id=== null) {
                reply += "The group handle is invalid\n";
            }
        }
        return reply;
    }

    async bulk_group_change_by_email(bot, emails, group_handle, dry){
        let reply = "";
        let userids = [];
        for (let email of emails){
            let userid = await this.lookup_userid_by_email(bot, email);
            if (userid !== null){
                userids.push(userid);
            }
            else {
                reply = {
                    ok: false,
                    message: "User " + email + " could not be found."
                }
            }
        }
        let group_data = await this.get_group_data(bot);
        let groupid = lookup_groupid_by_handle(group_handle, group_data);
        let groups_user_data = await this.get_groups_user_data(bot, groupid);
        if (compare_arrays(groups_user_data.users, userids)){
            reply = {
                ok: false,
                message: "No change required",
                users: userids
            }
        }
        else {
            if (dry === false){
                await this.update_groups_user_data(bot, groupid, userids.join());
            }
            reply = {
                ok: true,
                message: "Updated",
                users: userids
            }
        }
        return reply;
    }
}

module.exports = {
    Slack: Slack
};