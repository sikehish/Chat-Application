var axios = require('axios');

module.exports = function harperGet(room) {

    const dbUrl = process.env.HARPERDB_URL;
    const dbPw = process.env.HARPERDB_PW;

const data = JSON.stringify({
    "operation": "search_by_conditions",
    "schema": "realtime_chat_app",
    "table": "messages",
    "operator": "and",
    "offset": 0,
    // "limit": 10,
    "get_attributes": [
        "message","user","__createdtime__"
    ],
    "conditions": [
        {
            "search_attribute": "room",
            "search_type": "equals",
            "search_value": room
        }
    ]
});

var config = {
  method: 'post',
  url: dbUrl,
  headers: { 
    'Content-Type': 'application/json', 
    'Authorization': `Basic ${dbPw}`
  },
  data : data
};

return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        resolve(JSON.stringify(response.data));
      })
      .catch(function (error) {
        reject(error);
      });
  });

}