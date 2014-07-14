'use strict';
var yeoman = require('yeoman-generator');
var bower = require('bower');

var CmpGenerator = yeoman.generators.NamedBase.extend({

  askFor: function () {
    var done = this.async();
    this.name = (this.name || '').replace(/^cmp\-/, '').replace(/\s/g, '');

    // 如果有名字猜可以继续
    if (this.name) {
      var prompts = [{
        name: 'ver',
        message: 'What version would you take for ' + this.name + '?',
        default: '*'
      }];
      this.prompt(prompts, function (props) {
        this.ver = props.ver;
        done();
      }.bind(this));
    } else {
      // 否则给个提示
      console.log('Please enter component name, e.g, `yo act:cmp list`');
    }
  },

  bower: function () {
    var that = this;
    var cmpName;
    console.log('Installing component ' + this.name + '...');
    // todo 是否要将 内部和外部 component 拆开
    if (['vue'].indexOf(this.name) >= 0) {
      cmpName = this.name;
      if (this.ver !== '*') {
        cmpName += '#' + this.ver;
      }
      // 在 bower 官方下载
      bower.commands
        .install([cmpName])
        .on('end', function (installed) {
          // bower: 将 bower 下载的代码复制到项目中去
          // sails-linker: Vue 不是 seajs 模块，需要直接插入到页面中
          // clean:bower: 清空 bower 文件
          that.spawnCommand('grunt', ['bower', 'sails-linker:' + cmpName, 'clean:bower']);
        });
    } else {
      // gitlab 下载
      cmpName = 'git@git.ucweb.local:pf/cmp-' + this.name + '.git#' + this.ver;
      bower.commands
        .install([cmpName])
        .on('end', function (installed) {
          var pkgMeta = installed[that.name].pkgMeta;
          console.log(pkgMeta.name + ' (' + pkgMeta.version + ') installed!');
          // bower: 将 bower 下载的代码复制到项目中去
          // clean:bower: 清空 bower 文件
          that.spawnCommand('grunt', ['bower', 'clean:bower']);
        });

      // page 组件：自动添加 script
      if (this.name === 'page') {
        var indexFilePath = 'index_dev.html',
          fileStr = this.readFileAsString(indexFilePath);
        if (fileStr.indexOf('cmp/page') < 0) {
          this.appendToFile(
            indexFilePath,
            'body',
            '    <script>\n' +
            'seajs.use(\'cmp/page\', function (page) {\n' +
            '    \'use strict\';\n' +
            '    page.start(\'index\');\n' +
            '});\n' +
            '    </script>\n'
          );
          // 复制 page/index.js
          this.copy('public/js/page/index.js', 'public/js/page/index.js');
        }
      }
    }

    // 不用 this.bowerInstall 是因为没有 callback
    // this.bowerInstall([cmpName], { save: true });
  }

});

module.exports = CmpGenerator;
