'use strict';
var CobjView = require('./cobjview.js');
var CimageData = require('./cimagedata.js');
var pluginManager = require('./pluginmanager.js');
var Kern = require('../kern/Kern.js');
var WL = require('./wl.js');

/**
 * A View which can render images
 * @param {CimageData} dataModel
 * @param {object}        options
 * @extends CobjView
 */
var CimageView = CobjView.extend({
    constructor: function (dataModel, options) {
        options = options || {};
        CobjView.call(this, dataModel, Kern._extend({}, options, { noRender: true }));

        if (!options.noRender && (options.forceRender || !options.el))
            this.render();
    },
    render: function (options) {
        var attr = this.data.attributes,
            diff = this.data.changedAttributes || this.data.attributes,
            el = this.el;

        CobjView.prototype.render.call(this, options);

        if ('src' in diff) {
            el.setAttribute("src", WL.imagePath + attr.src);
        }

        if ('alt' in diff) {
            el.setAttribute("alt", attr.alt);
        }
    }

}, {
        Model: CimageData
    });

pluginManager.registerType('image', CimageView);
module.exports = CimageView;