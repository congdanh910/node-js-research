/**
 * Created by cuong.nd on 2/5/15.
 */
require('./util');

Site = function () {};
Site.siteMap = new HashMap();

// EVA PAGE ================
var evaObjectPost = new Object();
evaObjectPost.keyDom = 'div-baiviet';
evaObjectPost.keyDomPrefix = '.';
evaObjectPost.keyTime = 'baiviet-ngay';
evaObjectPost.queryRule = {
    'pathHtml' : true,
    'endHtml' :true,
    'pathRemove': '-c'
};
evaObjectPost.keyDelete = [];
evaObjectPost.keyDelete.push('<div class="fb-like fb_iframe_widget"');
evaObjectPost.keyDelete.push('<div class="thong-diep-mxh"');
evaObjectPost.keyDelete.push('<div class="baiviet-bailienquan">');
evaObjectPost.keyDelete.push('<div class="baiviet-tags">');

Site.siteMap.put('eva.vn', evaObjectPost);
