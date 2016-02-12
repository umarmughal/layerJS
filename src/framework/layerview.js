'use strict';
var $ = require('./domhelpers.js');
var Kern = require('../kern/Kern.js');
var pluginManager = require('./pluginmanager.js');
var layoutManager = require('./layoutmanager.js');
var LayerData = require('./layerdata.js');
var CGroupView = require('./cgroupview.js');

/**
 * A View which can have child views
 * @param {LayerData} dataModel
 * @param {object}        options
 * @extends CGroupView
 */

var LayerView = CGroupView.extend({
  constructor: function(dataModel, options) {
    options = options || {};
    var that = this;
    this.frames = {};
    this.inTransform = false;
    this.layout = new(layoutManager.get(dataModel.attributes.layoutType))(this);
    // we need to create the divs here instead of in the cobjview constructor
    this.elWrapper = options.el || document.createElement(dataModel.attributes.tag || 'div');
    // do we already have a scroller div?
    var hasScroller = this.elWrapper.childNodes.length == 1 && this.elWrapper.childNodes[0].getAttributes('data-wl-helper') == 'scroller';
    this.el = this.elWrapper;
    // should we not have a scroller?
    if (hasScroller && !dataModel.attributes.nativeScroll) $.unwrapChildren(this.elWrapper);
    // should we have a scroller but don't have one?
    if (!hasScroller && dataModel.attributes.nativeScroll) {
      // set el to scroller
      this.el = $.wrapChildren(this.elWrapper);
      hasScroller = true;
    }
    // mark scroller as scroller in HTML
    if (hasScroller) this.el.setAttribute('data-wl-helper', 'scroller');
    // call super constructor
    CGroupView.call(this, dataModel, Kern._extend({}, options, {
      noRender: true
    }));

    // this is my stage and add listener to keep it updated
    this.stage = this.parent;
    this.on('parent', function() {
      that.stage = that.parent
        // FIXME trigger adaption to new stage
    });
    // set current frame from data object or take first child
    this.currentFrame = (this.data.attributes.defaultFrame && this.findChildView(this.data.attributes.defaultFrame)) || (this.data.attributes.children[0] && this.getChildView(this.data.attributes.children[0]));
    if (!options.noRender && (options.forceRender || !options.el)) this.render();
    if (this.stage && this.currentFrame) this.stage.waitForDimensions().then(function() {
      that.layout.init(that.stage)
    });
  },
  /**
   * transform to a given frame in this layer with given transition
   *
   * @param {string} framename - (optional) frame name to transition to
   * @param {Object} transition - (optional) transition object
   * @returns {Type} Description
   */
  transitionTo: function(framename, transition) {
    // is framename  omitted?
    if (typeof framename === 'object') {
      transition = framename;
      framename = transition.frame;
    };
    transition = transition || {};
    framename = framename || transition.framename;
    if (!framename) throw "transformTo: no frame given";
    var frame = this.getChildViewByName(framename);
    if (!frame) throw "transformTo: " + framename + " does not exist in layer";
    var transformData = frame.getTransformData(this.stage, transition.startPosition);
    // calculate additional shift resulting from the current native scroll.
    var shift = {};
    if (this.data.attributes.nativeScroll) {
      shift.x = (transformData.scrollX || 0) - this.elWrapper.scrollLeft;
      shift.x = (transformData.scrollY || 0) - this.elWrapper.scrollTop;
      transformData.scrollX = 0; // should we save that somewhere? can scrollTop/LEft change during transition? probably.
      transformData.scrollY = 0;
      // shoud we remove maxScroll* ?
    }
    this.inTransform = true;
    var that = this;
    this.layout.transitionTo(frame, transition, this.currentFrame.getTransformData(this.stage), transformData).then(function() {
      // now that the transform finished we have to update the shift (transform ) and the scrollTop/Left and update length when native scrolling
      that.inTransform = false;
    });
    this.currentFrame = frame;
  },
  /**
   * overriden default behavior of groupview
   *
   * @param {CobjView} childView - the child view that has changed
   * @returns {Type} Description
   */
  _renderChildPosition(childView) {
    var attr = childView.data.attributes,
      diff = childView.data.changedAttributes || childView.data.attributes,
      el = childView.elWrapper;
    var css = {};
    // just do width & height for now; FIXME
    'width' in diff && attr.width !== undefined && (css.width = attr.width);
    'height' in diff && attr.height !== undefined && (css.height = attr.height);
    Kern._extend(el.style, css);
  }
}, {
  Model: LayerData
});

pluginManager.registerType('layer', LayerView);

module.exports = LayerView;