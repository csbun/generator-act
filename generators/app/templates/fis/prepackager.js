'use strict';

var UNIT_REG = /\{\{\{unit(?=\s)([^}]+)\}\}\}/g;
var UNIT_NAME_REG = /\sname\s*=\s*"([^"]+)"/;
var UNIT_DATA_REG = /\sdata\s*=\s*"([^"]+)"/;

var BACKEND_DATA = fis.config.get('backend.data');
var BACKEND_DATA_REG = BACKEND_DATA.reg;
var BACKEND_DATA_IMPORT = '`args String ' + BACKEND_DATA.server + ';\n';
var BACKEND_DATA_ARG = '${' + BACKEND_DATA.server + '}';

module.exports = function (ret, conf, settings, opt) {
    fis.util.map(ret.src, function (subpath, file) {
        if (file.isLayout && file.isHtmlLike) {
            var content = file.getContent();
            var needBackendImport = false;
            content = content
                // 替换 Layout 中的 组件单元
                .replace(UNIT_REG, function (m) {
                    var name, data;
                    m = m.replace(UNIT_NAME_REG, function (mm, $$1) {
                        name = $$1;
                        return '';
                    });
                    // TODO: data 暂时还没有用到
                    m = m.replace(UNIT_DATA_REG, function (mm, $$1) {
                        data = $$1;
                        return '';
                    });
                    if (name) {
                        // 找到组件
                        var cmpFilePath = '/components/' + name + '/' + name + '.html';
                        var cmpFile = ret.src[cmpFilePath];
                        if (cmpFile) {
                            m = cmpFile.getContent();
                        } else {
                            m = '<div style="color:red">component ' + name + ' NOT found!</div>';
                        }
                    } else {
                        m = '<!-- ' + m + ' -->';
                    }
                    return m;
                })
                // 替换 BACKEND_DATA
                .replace(BACKEND_DATA_REG, function () {
                    if (opt.pack) {
                        // 如果 -p 打包，则替换成 play 参数
                        needBackendImport = true;
                        return BACKEND_DATA_ARG;
                    } else {
                        // 否则替换成 backend-data.json 的内容
                        var mockBackendData = {};
                        var backendDataFilePath = file.subdirname + '/backend-data.json';
                        try {
                            mockBackendData = JSON.parse(ret.src[backendDataFilePath].getContent());
                        } catch (e) {}
                        return JSON.stringify(mockBackendData, null, 4);
                    }
                });
            if (needBackendImport) {
                content = BACKEND_DATA_IMPORT + content;
            }
            file.setContent(content);
        }

        // 如果 -p 打包且指定了 packRelease，则替换 release 路径
        if (opt.pack && file.hasOwnProperty('packRelease')) {
            file.release = file.packRelease;
        }
    });

};
