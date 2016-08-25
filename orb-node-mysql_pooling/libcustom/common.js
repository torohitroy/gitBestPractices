var gcm = require('node-gcm');
var pool = require('../config/mysql_pool');
module.exports = {
    compare_timings: function (start_time, end_time) {
        var now = new Date();
        end_time = new Date(Number(end_time) * 1000).getUTCHours() + ":" + ('0' + new Date(Number(end_time) * 1000).getUTCMinutes()).slice(-2);
        start_time = new Date(Number(start_time) * 1000).getUTCHours() + ":" + ('0' + new Date(Number(start_time) * 1000).getUTCMinutes()).slice(-2);
        var current_time = now.getUTCHours() + ':' + ('0' + now.getUTCMinutes()).slice(-2);
        if (start_time === end_time || (current_time == start_time || current_time == end_time))
            return true;
        if (start_time < end_time) {
            if (start_time < current_time && end_time > current_time) {
                return true;
            }
        } else {
            if ((start_time < current_time && end_time < current_time) || (current_time < start_time && current_time < end_time)) {
                return true;
            }
        }
        return false;
    },
    send_push: function (message_obj, device_token_array) {
   
        //Add your mobile device registration tokens here
        var regTokens = device_token_array;
        console.log(regTokens);
        
        // regTokens = ["cSNf7_1w54c:APA91bEfwaYsuuq_pKQJiqfiOPPio6h6d7mL2lwfxhtgFZBB0UodRln6-FSl0bitEFFnQEUlqQr9QjUmLjBFG8K5tGtkIbfqz2pXVlpxZU71PfXoct1t6eZULMD6UVuzNlNGvwjaVsmp","d2Id2p-WZGY:APA91bFUPmdq8Q2592SK0qkqxOEEsFGU_Essz_p5TdXb2LNZqXgK4p5HS1-6S254T38kT9Eh668oAOrPMQgr5MoHjzob_mq9krSUbf4G-G-5cL9LyHq9aY7utrebUmrHXvgZY1M0M6AK"]
        //Replace your developer API key with GCM enabled here
        var sender = new gcm.Sender("AIzaSyChrjT2iIMipxsM1rWtIhSxQLzN2CuJdis");
        message_obj.priority = 'high';
        message_obj.contentAvailable = true;
       
        var message = new gcm.Message(message_obj);
        //console.log(sender);
        sender.send(message, regTokens, function (err, response) {
            if (err) {
                console.log('in error');
                console.log(err);
            } else {
                console.log(response);
            }
        });
    },
    update_message_status: function (id_array, callback) {
        console.log(Math.floor(new Date().getTime() / 1000));
        pool.getConnection(function (err, connection) {
            connection.query('UPDATE ?? SET message_status = ? , delivery_time=FROM_UNIXTIME(?) WHERE id in (?)', ['message_sent_details', 'R', Math.floor(new Date().getTime() / 1000), id_array.join()],
                function (err, result) {
                    connection.release();
                    callback(err, result);
                });
        });
    }
}