function openApp(email, pass_token) {
    if (bowser.mobile || bowser.tablet) {
		if (bowser.android || bowser.ios) {
            //$('.gotoapp').html('<a href="' + android_link + 'username=' + email + '&pass_token=' + pass_token + '">Go to App</a>');
            //} else if (browserDetail.ios) {
            (function(b, r, a, n, c, h, _, s, d, k) {
                if (!b[n] || !b[n]._q) {
                    for (; s < _.length; )
                        c(h, _[s++]);
                    d = r.createElement(a);
                    d.async = 1;
                    d.src = "https://cdn.branch.io/branch-latest.min.js";
                    k = r.getElementsByTagName(a)[0];
                    k.parentNode.insertBefore(d, k);
                    b[n] = h
                }
            })(window, document, "script", "branch", function(b, r) {
                b[r] = function() {
                    b._q.push([r, arguments])
                }
            }, {_q: [], _v: 1}, "addListener applyCode banner closeBanner creditHistory credits data deepview deepviewCta first getCode init link logout redeem referrals removeListener sendSMS setBranchViewData setIdentity track validateCode".split(" "), 0);

            branch.init(branch_io_key, function(err, data) {
                    
                branch.setIdentity(email, function(err, data) {
                    
                    branch.link({
                        tags: [],
                        channel: 'user',
                        feature: 'dashboard',
                        stage: 'user login',
                        data: {
                            username: email,
                            pass_token: pass_token,
                            '$ios_url': ios_app_link + 'userlogin',
                            '$ipad_url': ios_app_link + 'userlogin',
                            '$android_url': android_link
                        }
                    }, function(err, link) {
                        $('.gotoapp').html('<a href="' + link + '">Go to App</a>');
                    });
                    
                });
                
            });
        }
    }
}
