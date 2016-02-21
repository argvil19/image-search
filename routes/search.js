var express = require('express');
var router = express.Router();
var https = require("https");

router.get('/:search?', function(req, res, next) {
    var googleSearch = "https://www.googleapis.com/customsearch/v1?key=AIzaSyAbcPiu6cKiDNzebHcV3_RB25UxM-nHMf4&cx=005549173105492732884:y2ciyzx7t2c";
    var searchParam = req.query.q;
    var offset = req.query.offset;
    if (searchParam) {
        googleSearch += "&q=" + searchParam;
    } else {
        res.send(JSON.stringify({error:"you must spicify a search parameter"}));
        return;
    }
    if (offset) {
        googleSearch += "&start=" + ((offset === "1")? 1:Number(offset + 0) - 10);
    }
    googleSearch += "&searchType=image";
    https.get(googleSearch, function(resApi) {
        resApi.setEncoding('utf8');
        var body = "";
        resApi.on("data", function(resData) {
            body += resData;
        });
        resApi.on("end", function() {
            var data = JSON.parse(body);
            if (data.error) {
                if (data.error.errors[0].message === "Daily Limit Exceeded") {
                    res.send(JSON.stringify({error:"Google custom search API: daily limit exceeded. Damn Google :("}));
                    return;
                }
                res.send(JSON.stringify({error:"incorrect value"}));
            } else {
                req.db.collection('lastest').insert({term:searchParam, log:new Date().getTime()}, function(err, dbdata) {
                    if (err) throw err;
                    req.db.collection('lastest').find().toArray(function(err, dbdata) {
                        if (err) throw err;
                        console.log(dbdata.length);
                        if (dbdata.length > 20) {
                            var older = 0;
                            for (var i=0; i<dbdata.length; i++) {
                                if (older < dbdata[i].log) {
                                    older = dbdata[i].log;
                                }
                            }
                            req.db.collection('lastest').remove({log:older});
                        }
                    })
                });
                data = data.items;
                if (typeof (data) === "undefined") {
                    res.send(JSON.stringify({error:"No results found"}));
                    return;
                }
                var searchRes = [];
                for (var i=0; i<data.length;i++) {
                    searchRes.push({
                        snippet:data[i].snippet,
                        url:data[i].link,
                        thumbnail:data[i].image.thumbnailLink,
                        context:data[i].image.contextLink
                    });
                }
                res.send(JSON.stringify(searchRes));
            }
        });
    });
});

module.exports = router;
