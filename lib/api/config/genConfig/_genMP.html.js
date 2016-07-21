'use strict'

let path = require('path');
let glob = require('glob');
// webpack plugins
let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let HtmlWebpackReplaceurlPlugin = require('html-webpack-replaceurl-plugin');
let WebpackSrcmapPlugin = require('webpack-srcmap-plugin');
let FaviconsWebpackPlugin = require('favicons-webpack-plugin');

let _ = require('lodash');

module.exports = function(config) {
    let _preloader = null,
        _loader = null,
        _postloader = null;
    let _plugins = [];

    let _dependencies = [];

    let _config = config.html;
    if (!_config) {
        return;
    }
    // 文件类型
    let _extType = _config.extType || 'html';
    // 匹配正则
    let reg_extType = _.isArray(_extType) ? new RegExp('\\.(' + _extType.join('|') + ')$') : new RegExp('\\.' +
        _extType + '$');

    // 如果用户配置了webpack loader，则沿袭用户的配置
    if (_config.webpackConfig) {
        // preloader
        _preloader = _config.webpackConfig.preloader|| null;
        // postloader
        _postloader = _config.webpackConfig.postloader|| null;
        // loader
        _loader = _config.webpackConfig.loader|| null;
    }
    // 如果用户配置了plugin，则使用用户配置
    // 默认基于模板源文件进行编译
    if (_config.webpackConfig && _config.webpackConfig.plugins && _config.webpackConfig.plugins.length !== 0) {
        _plugins.concat(_config.webpackConfig.plugins);
    } else {
        let __plugins = ((options) => {
            let __htmlPlugins = [];
            let _srcTpl = path.resolve(process.cwd(), config.basic.localPath.src, options.srcDir);
            let _files = (options.files && options.files !== '*') || glob.sync(_srcTpl + '/**/*.' +
                _extType);
            const REG_WITHEXT = new RegExp(options.srcDir + '\/' + options.mainFilePrefix +
                '\\.[\\w+\\.-]*' + _extType + '$');
            if (_files && _files.length !== 0) {
                _files.forEach(function(file) {
                    __htmlPlugins = __htmlPlugins.concat([
                        new HtmlWebpackPlugin({
                            // filename必须写相对路径，以output path为root
                            filename: REG_WITHEXT.exec(file)[0],
                            template: file,
                            inject: false,
                            xhtml: true,
                            minify: false,
                            hash: false
                        })
                    ]);
                });
            }
            __htmlPlugins.push(new HtmlWebpackReplaceurlPlugin({
                mainFilePrefix: {
                    js: config.js.files? '' : config.js.mainFilePrefix,
                    css: config.js.files? '' : config.style.mainFilePrefix
                },
                vendor: config.js.mutiEntriesVendor || (config.js.files&&config.js.files.vendor)?'vendor.js': null
            }));
            if(_config.staticSrcmap){
                __htmlPlugins.push(new WebpackSrcmapPlugin({
                    outputfile: 'manifest.json',
                    nameWithHash: true
                }));
            }
            if(_config.favicon){
                __htmlPlugins.push(new FaviconsWebpackPlugin({
                    logo: path.join(process.cwd(),_config.favicon),
                    inject: true,
                    prefix: path.join(config.image.destDir + '/favicons/'),
                    statsFilename: 'iconstats.json',
                    persistentCache: false,
                    icons: {
                      android: false,
                      appleIcon: false,
                      appleStartup: false,
                      coast: false,
                      favicons: true,
                      firefox: false,
                      opengraph: false,
                      twitter: false,
                      yandex: false,
                      windows: false
                    }
                }));
            }
            return __htmlPlugins;
        })(_config);
        _plugins = _plugins.concat(__plugins);
    }

    // 如果loader为空，则使用默认loader
    // 默认loader是html-loader
    if (!_loader) {
        _loader = ((options) => {
            return Object.assign({}, {
                test: reg_extType,
                loader: 'html',
                query: {
                    // I don't what this configuration for,but it just works...
                    // @see https://github.com/webpack/webpack/issues/752
                    "minimize": false,
                    // 保留html注释
                    "removeComments": false,
                    // 不压缩
                    "collapseWhitespace": false
                }
            });
        })(_config);
    }

    return {
        preloader: _preloader,
        postloader: _postloader,
        loader: _loader,
        plugins: _plugins,
        dependencies: _dependencies
    };
}