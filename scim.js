const request = require("request-promise-native");

function lookup_groupid(group_name, group_data){
    let group_id = null;
    for (let group of group_data["Resources"]){
        if (group.displayName === group_name){
            group_id = group.id;
        }
    }
    return group_id;
}

function lookup_userid(user_name, user_data){
    let user_id = null;
    for (let user of user_data["Resources"]){
        if (user.userName === user_name){
            user_id = user.id;
        }
    }
    return user_id;
}

class Scim {
    constructor(token){
        this.url = "https://api.slack.com/scim/v1/";
        this.token = token;
    }

    async get_user_data(){
        let options = {
            url: this.url + "Users",
            json: true,
            headers: {
                "Authorization": "Bearer " + this.token,
                "Accept": "application/json"
            }
        };
        return await request.get(options);
    }

    async get_username(userid){
        let options = {
            url: this.url + "Users/" + userid,
            json: true,
            headers: {
                "Authorization": "Bearer " + this.token,
                "Accept": "application/json"
            }
        };
        let response = await request.get(options);
        return response.userName;
    }

    async get_groupname(groupid){
        let options = {
            url: this.url + "Groups/" + groupid,
            json: true,
            headers: {
                "Authorization": "Bearer " + this.token,
                "Accept": "application/json"
            }
        };
        let response = await request.get(options);
        return response.displayName;
    }

    async get_group_data(){
        let options = {
            url: this.url + "Groups",
            json: true,
            headers: {
                "Authorization": "Bearer " + this.token,
                "Accept": "application/json"
            }
        };
        return await request.get(options);
    }

    async list_users(){
        let response = await this.get_user_data();
        let user_list = [];
        for (let user of response["Resources"]){
            user_list.push(user["id"])
        }
        return user_list;
    }

    async list_groups(){
        let response = await this.get_group_data();
        let group_list = {};
        for (let group of response["Resources"]){
            group_list[group["id"]] = group["members"];
        }
        return group_list;
    }

    async group_change(username, groupname, action){
        let group_data = await this.get_group_data();
        let group_id = lookup_groupid(groupname, group_data);
        let user_data = await this.get_user_data();
        let user_id = lookup_userid(username, user_data);
        let options = {
            url: this.url + "Groups/" + group_id,
            json: true,
            headers: {
                "Authorization": "Bearer " + this.token,
                "Accept": "application/json"
            },
            body: {
                "schemas": ['urn:scim:schemas:core:1.0'],
                "members": [
                    {
                        "value": user_id,
                    }
                ]
            }
        };
        if (action === "remove"){
            options["body"]["members"][0]["operation"] = "delete"
        }
        console.log(options);
        let response = await request.patch(options);
    }

}

module.exports = {
    Scim: Scim
};