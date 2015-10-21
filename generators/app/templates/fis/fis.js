'use strict';

module.exports = function () {
    // roadmap.path
    fis.config.set('roadmap.path', require('./roadmap.path'));

    // preprocessor
    var preprocessor = require('./preprocessor');
    fis.config.set('modules.preprocessor.html', preprocessor.I18N);
    fis.config.set('modules.preprocessor.js', preprocessor.JS);
    // fis.config.set('modules.preprocessor.less', preprocessor.CSS);

    // prepackager
    fis.config.set('modules.prepackager', require('./prepackager'));
};
