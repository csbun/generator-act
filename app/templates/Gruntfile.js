module.exports = function (grunt) {
    'use strict';

    //自动load所有的task
    require('load-grunt-tasks')(grunt);

    var devConfig = grunt.file.readJSON('conf/dev.json'),
        initConfig = {
            pkg: grunt.file.readJSON('package.json'),
            meta: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
            },
            // 代码检查
            jshint: {
                all: [
                    'public/js/**/*.js'
                ],
                options: {
                    jshintrc: '.jshintrc',
                    ignores: [
                        'public/js/seajs/*.js',
                        'public/js/cmp/*.js'
                    ],
                }
            },
            // 将 bower 依赖的文件复制到项目中
            bower: {
                cmp: {
                    dest: 'public/js/cmp'
                }
            },
            // 转换 cmd 文件
            cmd: {
                options: {
                    base: 'public/js/',
                    shim: {}
                },
                all: {
                    src: [
                        'public/js/**/*.js'
                    ],
                    ignores: [
                    ],
                    dest: 'public/compiled'
                }
            },
            // 压缩 js
            uglify: {
                js: {
                    files: {
                        'public/dist/app.js': [
                            '<%= cmd.all.dest %>/seajs/sea.js',
                            '<%= cmd.all.dest %>/**/*.js'
                        ]
                    }
                }
            },
            // 压缩 css
            cssmin: {
                'add_banner': {
                    options: {
                        keepSpecialComments: 0 // removing all
                    },
                    files: {
                        'public/dist/style.css': [
                            'public/css/*.css'
                        ]
                    }
                }
            },
            // 生成可发布的 html
            processhtml: {
                dist: {
                    files: {}
                }
            },
            // 将静态文件按 md5 命名
            hashres: {
                options: {
                    encoding: 'utf8',
                    fileNameFormat: '${name}.${hash}.${ext}',
                    renameFiles: true
                },
                prod: {
                    src: [
                        'public/dist/app.js',
                        'public/dist/style.css'
                    ],
                    dest: [],
                }
            },
            // 给 md5 的静态文件添加 banner
            usebanner: {
                md5: {
                    options: {
                        banner: '<%= meta.banner %>',
                    },
                    files: {
                        src: ['public/dist/*']
                    }
                }
            },
            // 清除 cmd 生成的文件
            clean: {
                bower: ['bower_components'],
                cmd: ['<%= cmd.all.dest %>'],
                dist: ['public/dist']
            },
            // 开发服务器
            express: {
                options: {
                    port: devConfig.port
                },
                dev: {
                    options: {
                        script: 'server/express.js'
                    }
                }
            },
            // 监听
            watch: {
                express: {
                    files: [
                        'server/*.js',
                        'conf/dev.json'
                    ],
                    tasks: ['express:dev'],
                    options: {
                        spawn: false
                    }
                },
                project: {
                    files: [
                        'public/**/*'
                    ],
                    options: {
                        livereload: devConfig.livereload.enable?devConfig.livereload.port:false
                    }
                }
            },
            // 压缩图片
            imagemin: {
                dist: {
                    options: {
                        optimizationLevel: 3
                    },
                    files: [{
                        expand: true,
                        cwd: 'public/images/',
                        src: ['*.{png,jpg,gif}'],
                        dest: 'public/images/'
                    }]
                }
            },
            //在线压缩图片，dev.json中默认关闭此task，建议在ui图确认后开启该task，之后无须关闭。
            //注意:每个apkKey一个月只能免费压缩500张图片，如果用完了，请转到https://tinypng.com/developers申请新的apiKey
            tinypng: {
                options: {
                    apiKey: devConfig.tinypng.apiKey,
                    checkSigs: true,
                    sigFile: 'config/.tinypng_file_compressed',
                    summarize: true,
                    showProgress: true,
                    stopOnImageError: true
                },
                compress: {
                    expand: true, 
                    cwd: 'public/images/',
                    src: ['*.png', '*.jpg'],
                    dest: 'public/images/'
                }
            },
            // 图片文件变化
            'file_modified': {
                images: {
                    options: {
                        paths: ['public/images/']
                    }
                }
            },
            // BrowserSync
            browserSync: {
                dev: {
                    bsFiles: {
                        src : 'public/css/*.css'
                    },
                    options: {
                        proxy: '127.0.0.1:' + devConfig.port
                    }
                }
            },
            // 各种替换
            replace: {}
        },
        defaultTask = [
            'jshint',
            'cmd',
            'clean:dist',
            'uglify',
            'cssmin',
            'processhtml'
        ],
        DEV_HTML_PATH = 'public/views/',
        PLAY_VIEWS_PATH = 'app/japidviews/FrontendController/';

    // 初始化 devConfig
    initDevConfig();

    // 翻译任务任务
    translate();

    // 前端开发模版转换为play模版任务
    htmlRelease();

    defaultTask = defaultTask.concat([
        'hashres',
        'usebanner',
        'clean:cmd',
        'imagemin:dist',
        'file_modified'
    ]);

    // 初始化dev.json中配置的task，比如tinypng是否要加入到task中
    initTask();

    grunt.initConfig(initConfig);

    // 发布任务
    grunt.registerTask('default', defaultTask);
    // grunt.registerTask('release', defaultTask);

    // 开发服务器任务
    grunt.registerTask('dev', [
        'express:dev',
        // TODO: browserSync 视乎和 livereload 不兼容
        // 'browserSync',
        'watch'
    ]);

    /**
     * 初始化 devConfig
     * 将多语言 devConfig.languages 写到 devConfig.views
     */
    function initDevConfig() {
        var langViews = [];
        if (devConfig.languages && devConfig.languages.files) {
            devConfig.languages.files.forEach(function (file) {
                var view;
                devConfig.views.some(function (v) {
                    if (v.html === file) {
                        view = v;
                        return true;
                    }
                    return false;
                });
                if (view) {
                    devConfig.languages.lang.forEach(function (lang) {
                        var v = Object.create(view);
                        v.html += '_' + lang;
                        langViews.push(v);
                    });
                    view.html = '';
                }
            });
            devConfig.views = devConfig.views.concat(langViews);
        }
    }

    //初始化dev.json中配置的task，比如tinypng是否要加入到task中
    function initTask(){
        var n = defaultTask.length,
            i, 
            j = -1;
        if(devConfig.tinypng.enable){
            for(i = 0; i < n; i++){
                if(defaultTask[i].indexOf('imagemin')>-1){
                    j = i+1;
                    break;
                }
            }
            defaultTask.splice(j, 0, 'tinypng');
        }
    }

    // 添加模版转换任务
    function htmlRelease() {

        var htmlConfig = devConfig.views,
            i;
        for (i = 0; i < htmlConfig.length; ++i) {
            if (!htmlConfig[i].html) {
                continue;
            }
            var argsStr = '',
                config = htmlConfig[i],
                prePatterns = [{
                    match: /`/g,
                    replacement: ''
                }, {
                    match: /@/g,
                    replacement: '~@'
                }, {
                    match: /\$/g,
                    replacement: '~$'
                }, {
                    match: /~/g,
                    replacement: '~~'
                }],
                patterns;
            // 模版发布任务
            initConfig.processhtml.dist.files[PLAY_VIEWS_PATH + htmlConfig[i].html + '.html'] = [DEV_HTML_PATH + htmlConfig[i].html + '.html'];
            // hash任务
            initConfig.hashres.prod.dest.push(PLAY_VIEWS_PATH + htmlConfig[i].html + '.html');
            initConfig.replace['pre_' + config.html] = {
                options: {
                    patterns: prePatterns
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: PLAY_VIEWS_PATH + config.html + '.html',
                    dest: PLAY_VIEWS_PATH
                }]
            };
            defaultTask.push('replace:pre_' + config.html);
            if (config.args && config.args.length !== 0) {
                argsStr = __getArgsStr(config.args);
                patterns = __getArgsPatterns(config.args);
                patterns.push({
                    match: /<!DOCTYPE HTML>/gi,
                    replacement: argsStr
                });
                initConfig.replace[config.html] = {
                    options: {
                        patterns: patterns
                    },
                    files: [{
                        expand: true,
                        flatten: true,
                        src: PLAY_VIEWS_PATH + config.html + '.html',
                        dest: PLAY_VIEWS_PATH
                    }]
                };
                defaultTask.push('replace:' + config.html);
            }
        }
    }

    function __getArgsStr(args) {
        var i, argsStr = '`args ';
        for (i = 0; i < args.length; ++i) {
            argsStr += args[i].type + ' ';
            argsStr += args[i].name + ',';
        }
        argsStr = argsStr.substring(0, argsStr.length - 1);
        argsStr += '\n<!DOCTYPE HTML>';
        return argsStr;
    }

    function __getArgsPatterns(args) {
        var i, patterns = [];
        for (i = 0; i < args.length; ++i) {
            var replacement = '';
            if (args[i].type === 'String') {
                replacement = args[i].name + ': \'${' + args[i].name + '}\',';
            } else {
                replacement = args[i].name + ': ${' + args[i].name + '},';
            }
            patterns.push({
                match: new RegExp('/\\*\\s*render ' + args[i].name + '\\s*\\*/\\s*.*', 'gi'),
                replacement: replacement
            });
        }
        return patterns;
    }

    // 翻译任务任务
    function translate() {
        var i, j, LANGUAGES = devConfig.languages.lang,
            FILES = devConfig.languages.files,
            U2_FILES = devConfig.languages.u2Files,
            lang, conf, watchFiles = [],
            watchTasks = [];
        for (i = 0; i < LANGUAGES.length; i++) {
            lang = LANGUAGES[i];
            conf = {
                options: {
                    patterns: [{
                        json: grunt.file.readJSON('languages/' + lang + '.json')
                    }]
                },
                files: []
            };
            for (j = 0; j < FILES.length; j++) {
                conf.files.push({
                    src: DEV_HTML_PATH + FILES[j] + '.html',
                    dest: DEV_HTML_PATH + FILES[j] + '_' + lang + '.html'
                });
            }
            for (j = 0; j < U2_FILES.length; j++) {
                conf.files.push({
                    src: PLAY_VIEWS_PATH + U2_FILES[j] + '.html',
                    dest: PLAY_VIEWS_PATH + U2_FILES[j] + '_' + lang + '.html'
                });
            }
            initConfig.replace[lang] = conf;
            defaultTask.unshift('replace:' + lang);
            watchTasks.push('replace:' + lang);
        }
        if (LANGUAGES && LANGUAGES.length > 0) {
            for (i = 0; i < FILES.length; i++) {
                watchFiles.push(DEV_HTML_PATH + FILES[i] + '.html');
            }
            initConfig.watch.translate = {
                files: watchFiles,
                tasks: watchTasks,
                options: {
                    livereload: devConfig.livereload.enable?devConfig.livereload.port:false
                }
            };
            initConfig.watch.translate.files.push('languages/*');
        }
    }
};
