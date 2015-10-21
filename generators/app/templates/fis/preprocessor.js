'use strict';

var fs = require('fs');
var path = require('path');
var Ejs = require('./ejs');

var PROJECT_DIR = fis.project.getProjectPath();
var I18N = fis.config.get('base.i18n');
var I18N_FILE_PATH = path.join(PROJECT_DIR, 'i18n', I18N + '.json');

var getI18nData = function (file) {
    file.cache.addDeps(I18N_FILE_PATH);
    try {
        return JSON.parse(fs.readFileSync(I18N_FILE_PATH, 'utf8'));
    } catch (e) {
        console.error(e.message);
        return {};
    }
};

/**
 * 将错误信息输出为 html 片段
 * @param  {Error} err 错误信息
 * @return {string}    html 片段
 */
var wrapError = function (err) {
    var html = '<div style="color:red">';
    html += '<h2>' + (err.message || err) + '</h2>';
    if(err.stack){
        html += '<pre>' + err.stack + '</pre>';
    }
    html += '</div>';
    return html;
};

exports.I18N = function (content, file) {
    // 读取 i18n 数据
    var i18nData = getI18nData(file);
    // 渲染 ejs 数据
    try {
        content = (new Ejs({
            text: content
        })).render(i18nData);
    } catch (e) {
        wrapError(e);
    }
    return content;
};


var deasync = require('deasync');
var browserify = require('browserify');
var REQUIRE_REG = /require\('([^']+)'\)/g;

exports.JS = function (content, file) {
    if (file.isLayout && file.isJsLike) {
        var isDone = false;
        // do browserify
        browserify(file.realpath, {
            debug: true
        }).bundle(function (err, buff) {
            if (err) {
                console.error(err.message);
            } else {
                content = buff.toString();
            }
            isDone = true;
        });
        // simply find dependences
        var matches = [];
        while (matches) {
            var depFile = matches[1];
            if (depFile) {
                if (!/\.js$/.test(depFile)) {
                    depFile += '.js';
                }
                depFile = path.resolve(file.dirname, depFile);
                if (fs.existsSync(depFile)) {
                    file.cache.addDeps(depFile);
                }
            }
            matches = REQUIRE_REG.exec(content);
        }
        // 使用 deasync 让 browserify 同步输出到 content
        deasync.loopWhile(function (){
            return !isDone;
        });
    }
    return content;
};

// exports.CSS = function (content, file) {
//     console.log(file.realpath);
//     // todo combo css
//     return content;
// };
