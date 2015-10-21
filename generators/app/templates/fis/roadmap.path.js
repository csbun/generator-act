module.exports = [
    {
        reg: 'node_modules/**',
        release: false
    },
    {
        reg: /^\/views\/([^\/]+)\/backend-data.json$/,
        packRelease: false
    },
    {
        reg: /^\/views\/([^\/]+)\/\1\.html$/,
        isLayout: true,
        useCache : false, // 不用人肉添加 cache 文件依赖
        release: '/${base.path}/$1.${base.i18n}.html',
        packRelease: '/${backend.japid}/$1.${base.i18n}.html'
    },
    {
        reg: /^\/views\/([^\/]+)\/\1\.(js|css|scss|less)$/,
        isLayout: true,
        release: '/${base.path}/$1.$2',
        packRelease: '/${backend.static}/$1.$2'
    },
    {
        reg: /components\/([^\/]+)\/\1\.html$/,
        isComponent: true,
        release: '/${base.path}/c/$1/$1.html',
        packRelease: false
    },
    {
        reg: /components\/([^\/]+)\/\1\.(js|css|scss|less)$/,
        isComponent: true,
        release: false
    },
    {
        reg: /components\/(.*)$/,
        release: '/${base.path}/c/$1',
        packRelease: '/${backend.static}/c/$1'
    },
    {
        reg: 'server/**',
        packRelease: false
    },
    {
        reg: 'package.json',
        packRelease: false
    },
    {
        reg: 'map.json',
        release: false
    },
    {
        reg: '**',
        release: false
    }
];
