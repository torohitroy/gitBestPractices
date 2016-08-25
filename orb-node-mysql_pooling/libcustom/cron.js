var pool = require('../config/mysql_pool');
var CronJob = require('cron').CronJob;
var common = require('./common');
var job = new CronJob('*/30 * * * * *', function () {
    var user_share_location = [];
    var user_fetch_location = [];
    var msd_id_array = [];
    pool.getConnection(function (err, connection) {
        connection.query('SELECT msd.friend_id, msd.id, ul.start_time, ul.end_time, ul.timekey, u.device_type, u.device_token from message_sent_details as msd left join users as u on msd.friend_id = u.id left join user_locations as ul on u.id = ul.user_id where msd.message_status = ? order by msd.created_at DESC limit 1000', ['P'], function (err, result) {
            if (err) {
                console.log(err);
            }
            result.forEach(function (val, i) {
                switch (val.timekey) {
                    case null:
                        msd_id_array.push(val.id);
                        user_fetch_location.push(val.device_token);
                        break;

                    case 'D':
                        if (user_share_location.indexOf(val.device_token) == -1) {
                            user_share_location.push(val.device_token);
                        }
                        break;

                    case 'E':

                        if (user_share_location.indexOf(val.device_token) == -1) {
                            if (common.compare_timings(val.start_time, val.end_time)) {
                                user_share_location.push(val.device_token);
                            }
                        }
                        break;
                }
            });
            if (msd_id_array.length) {
                common.update_message_status(msd_id_array, function (err, result) {
                    if (!err) {
                        var message_fetch = {
                            data: { FETCH_MESSAGE: 'FETCH_MESSAGE', MESSAGE: 'View all fetch messages' }

                        };
                        message_fetch.notification = {
                            title: 'Fetch Message',
                            body: 'View all fetch messages',
                            sound: 'default'
                        };
                        common.send_push(message_fetch, user_fetch_location);
                    }
                });
            }
            if (user_share_location.length) {
                var message_share = {

                    data: { SHARE_LOCATION: 'SHARE_LOCATION', MESSAGE: 'Please share your location' }
                };
                // message_share.notification = {
                //     title: 'Share Location',
                //     body: 'Please share your location',
                //     sound: 'default'
                // };
                common.send_push(message_share, user_share_location);
                //connection.release();
            }
            connection.release();
        });
    });
}, function () {

},
    true
    );

