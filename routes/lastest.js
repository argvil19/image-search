var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    console.log(req.bd);
    req.db.collection('lastest').find({}, {_id:0, log:0}).toArray(function(err, data) {
        if (err) throw err;
        res.send(JSON.stringify(data));
    });
});

module.exports = router;