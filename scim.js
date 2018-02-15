const request = require("request-promise-native");
class Scim{
    constructor(token){
        this.options = {
            'auth': {
                'bearer': token
            }
        };
    }

    async list_users(){
        let user_list = await request.get("https://api.slack.com/scim/v1/Users", this.options);
        return user_list;
    }



}

module.exports = {
    Scim: Scim
};