const request = require("request-promise-native");
const vo_api_url = 'https://api.victorops.com/api-public/v1/';
const primary = 'team/devops/oncall/schedule?daysForward=1&daysSkip=0&step=0';
const secondary = 'team/devops-secondary/oncall/schedule?daysForward=1&daysSkip=0&step=0';


class VO {
    constructor(vo_id, vo_token){
        this.headers = {
            "X-VO-Api-Id": vo_id,
            "X-VO-Api-Key": vo_token
        };
    }
    async get_primary_oncall_data(){
        let options = {
            url: vo_api_url + primary,
            json: true,
            headers: this.headers
        };
        return await request.get(options);
    }
    async get_secondary_oncall_data(){
        let options = {
            url: vo_api_url + secondary,
            json: true,
            headers: this.headers
        };
        return await request.get(options);
    }

    async get_current_oncall_users(){
        let users = [];
        let pri_oncall_data = await this.get_primary_oncall_data();
        for (let schedule of pri_oncall_data.schedule){
            if ('onCall' in schedule){
                users.push(schedule.onCall)
            }
        }
        for (let schedule of pri_oncall_data.schedule){
            if ('overridOnCall' in schedule){
                users.push(schedule.overrideOnCall)
            }
        }
        //Uncomment for secondary oncall shift
        /**
         let sec_oncall_data = await this.get_secondary_oncall_data();
         for (let schedule of sec_oncall_data.schedule){
            if ('onCall' in schedule){
                users.push(schedule.onCall)
            }
        }

        for (let schedule of sec_oncall_data.schedule){
            if ('overridOnCall' in schedule){
                users.push(schedule.overrideOnCall)
            }
        }
        **/
        return users;
    }

    async get_user_data(user){
        let options = {
            url: vo_api_url + "user/" + user,
            json: true,
            headers: this.headers
        };
        return await request.get(options);
    }

    async lookup_email(user){
        let user_data = await this.get_user_data(user);
        let email_match_string = /(.*)@.*/;
        let matches = email_match_string.exec(user_data.email);
        return matches[1] + "@ns1.com";
    }
}

module.exports = {
    VO: VO
};