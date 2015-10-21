'use strict';

var path = require('path');
var express = require('express');

var BASE_DIR = path.join(__dirname, '..');
var PORT = process.env.PORT || 5000;

var app = express();
app.use(express.static(BASE_DIR, {}));

app.listen(PORT, function () {
    console.log('Express server listening on port %d', PORT);
});
