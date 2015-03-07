// This is the main file of our chat app. It initializes a new 
// express.js instance, requires the config and routes files
// and listens on a port. Start the application by running
// 'node app.js' in your terminal

var express = require('express'),
    app = express();
var fs = require('fs');
var moment = require('moment');

var port = process.env.PORT || 4000;

app.listen(port);

var Crawler = require("crawler");
require('./config')(app);
require('./util');
require('./siteMap');

app.get('/', function (req, res) {
    res.set("Access-Control-Allow-Credentials", true);
    res.set("Access-Control-Allow-Origin", "http://localhost:4000");
    res.render('home');
});

app.get('/crawler', function (req, res) {
    var path = req.query.path;
    if(path.indexOf('http://') < 0) {
        path = 'http://' + path;
    }
    var pathPage = getPathOfPage(path);
    var homePage = getHomePage(path);
    var siteRule = Site.siteMap;
    var rules = siteRule.get(homePage);

    var isReturn = false;
    var retrievedPage = [];

    var resultMap = new HashMap();
    var c = new Crawler({
        retryTimeout: 10000,
        maxSizeResult: 20,
        maxConnections: 20,
        skipDuplicates: true,
        // This will be called for each crawled page
        callback: function (error, result, $) {
            try {
                // checking result with key DOM & optimsize body
                if (result) {

                    var bodyObject = {};
                    bodyObject.bodySummary = getBodySummary($);
                    bodyObject.bodyContent = getBodyContent(result.body, rules, $);

                    if (resultMap.size() <= c.options.maxSizeResult &&
                        isThisPageIsAPost(result, rules, result.request.href) &&
                        isPostTimeAcceptable(result, rules)) {

                        var title = getTitle(result);
                        console.log("GONNA PUSH TO MAP ==========" + resultMap.size());
                        resultMap.put(title, bodyObject);
                    }
                }

                if ($ != undefined) {
                    var atags = $('a');
                    if (atags != undefined && atags.length > 0) {
                        for (var i = 0; i < atags.length; i++) {
                            var toQueueUrl;
                            if (atags[i] != undefined && $(atags[i]) != undefined) {
                                toQueueUrl = $(atags[i]).attr('href');

                                // TODO : detect category & post Form key DOM
                                var pathPageEdited = pathPageWithRule(pathPage, rules);
                                if (toQueueUrl != undefined && toQueueUrl.length > 0 &&
                                    toQueueUrl.indexOf(pathPageEdited) >= 0) {
                                    //checking rule of page
                                    var finalUrl = constructFinalUrl(homePage, toQueueUrl);
                                    //var checkingRule = checkWithRule(finalUrl, rules);
                                    if (resultMap.size() < c.options.maxSizeResult && retrievedPage.indexOf(finalUrl) < 0) {
                                        console.log(finalUrl);
                                        c.queue(finalUrl);
                                        retrievedPage.push(finalUrl);
                                    }
                                }
                            }
                        }
                    }
                }

            } catch (err) {
                console.log("ERRROR =====================" + err);
            }
        },
        onDrain: function () {
            console.log("=================RESPONSE AT END============");
            if (isReturn == false) {
                isReturn = true;
                res.status(200).json(resultMap);
            }
        }
    });
    c.queue(path);
    retrievedPage.push(path);
});

function isPostTimeAcceptable(result, rules){
    var body = result.body;
    if(body.match(rules.keyTime)){
        var indexKeyTime = body.indexOf(rules.keyTime);
        body = body.substring(indexKeyTime, indexKeyTime + 50);
    }
    if(DateUtil.rangeOfTwoDate(moment(), DateUtil.toDateTime(body)) <= 7){
        return true;
    }
    return false;
}

function pathPageWithRule(pathPage, rules){
    if(rules != "" && rules.queryRule.pathHtml){
        // remove html pathPage
        pathPage = pathPage.substr(0, pathPage.indexOf(".html"));

        var indexRemovePath = pathPage.indexOf(rules.queryRule.pathRemove);
        if(rules.queryRule.pathRemove != '' && indexRemovePath >= 0){
            pathPage = pathPage.substring(0, indexRemovePath);
        }
        return pathPage;
    }else{
        //default
        return pathPage;
    }
}

function constructFinalUrl(homePage, queryURL) {
    // remove search query page link
    if (queryURL.indexOf(".html") > 0) {
        queryURL = queryURL.substring(0, queryURL.indexOf(".html") + 5);
    }
    var finalUrl = queryURL;
    var isMatch = queryURL.match(homePage);
    if(isMatch == null || isMatch.length < 0){
        finalUrl = homePage + finalUrl;

        if (finalUrl.indexOf("http://") != 0 || finalUrl.indexOf("https://") != 0) {
            finalUrl = "http://" + finalUrl;
        }
    }
    return finalUrl;
}

function getBodyContent(resultBody, rules, $) {
    if(resultBody.match(rules.keyDom)){
        var divKeyDom = $(rules.keyDomPrefix + rules.keyDom);
        var divParent = $(divKeyDom).parent();
        return $(divParent).html();
    }
    return "";
}

function isThisPageIsAPost(result, rules, queryUrl) {
    if (rules != "") {
        var match = result.body.match(rules.keyDom);
        if (match && match.length > 0) {
            return true;
        }
    } else {
        // Default page is post is have .html at the end url
        if (queryUrl.indexOf(".html") > 0) {
            return true;
        }
    }
    return false;
}

function getHomePage(path) {
    // remove http if existed
    if (path.indexOf("//") > 0) {
        path = path.substring(path.indexOf("//") + 2);
    }

    var index = path.indexOf('/');
    if (index < 0) return "";
    return path.substring(0, index);
}

function getPathOfPage(path) {
    // remove http if existed
    if (path.indexOf("//") > 0) {
        path = path.substring(path.indexOf("//") + 2);
    }
    var index = path.indexOf('/');
    if (index < 0) return "";
    return path.substring(index);
}

function getTitle(result) {
    var body = result.body;
    var start = body.indexOf("<title>") + 7;
    var end = body.indexOf("</title>");
    return '<a href="' + result.request.href + '">' + body.substring(start, end) + '</a>';
}

function getBodySummary($) {
    var result = '';
    if ($ != undefined) {
        var metas = $('meta');
        if (metas != undefined && metas != null && metas.length > 0) {
            for (var i = 0; i < metas.length; i++) {
                if (metas[i] != undefined && $(metas[i]) != undefined) {
                    var name = $(metas[i]).attr('name');
                    if (name != undefined && name.length > 0 && (name == 'description' || name == 'keywords')) {
                        var tmp = $(metas[i]).attr('content');
                        if (tmp != undefined && tmp.length > 0) {
                            result += '<span>' + tmp + '</span><br>';
                        }
                    }
                }
            }
        }
    }
    return result;
}

console.log('Your application is running on http://localhost:' + port);
