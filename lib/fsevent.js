'use strict';

const FSError = require('./error');

/**
 * Fake binding to replace fs_event_wrap with.
 * @param {FileSystem} system Mock file system.
 * @constructor
 */
function FSEventWrapBinding(system) {
  // Note that _system here is effectively global. I don't see an easier way to do this though.
  this.FSEvent._system = system;
}

/**
 * Construct a new FSEvent.
 * @constructor
 */
function FSEvent() {
  /**
   * Item we are watching.
   * @type {Item}
   */
  this._item = null;

  /**
   * Listener function that is currently subscribed (so we can unsubscribe it).
   * @type {function}
   */
  this._listener = null;

  /**
   * Whether we are currently watching. Checked by the FSWatcher implementation.
   * @type {boolean}
   */
  this.initialized = false;
}

/**
 * Handler for change events for the item we are tracking.
 * This will be replaced with a function from Node's internal/fs/watchers.js.
 */
FSEvent.prototype.onchange = function(status, eventType, filename) {};

/**
 * Refcounting. Ignored because we aren't wrapping a native object.
 */
FSEvent.prototype.ref = function() {};

/**
 * Refcounting. Ignored because we aren't wrapping a native object.
 */
FSEvent.prototype.unref = function() {};

/**
 * Start watching a file. This function is called by fs.watch() internally, by way of the
 * FSWatcher.prototype[kFSWatchStart] function.
 */
FSEvent.prototype.start = function(filepath, persistent, recursive, encoding) {
  if (recursive) {
    // TODO: Can we throw the correct Node internal error type here? Does it matter?
    throw new FSError('Recursive watch is not supported');
  }
  // TODO: Implement persistent? All watchers are currently "persistent" as long as we are mocked
  // TODO: Implement encoding='buffer' case
  const item = FSEvent._system.getItem(filepath);
  if (!item) {
    throw new FSError('ENOENT', filepath);
  }
  if (!item.canRead()) {
    throw new FSError('EACCES', filepath);
  }
  this._item = item;
  const onchange = this.onchange;
  this._listener = function(eventType, filename) {
    // TODO: The stats parameter here is wrong, but fs.watch() doesn't use it
    onchange(1, eventType, filename);
  };
  this._item.getWatcher().addListener('change', this._listener);
  this.initialized = true;
};

FSEvent.prototype.close = function() {
  this._item.getWatcher().removeListener('change', this._listener);
};

FSEventWrapBinding.prototype.FSEvent = FSEvent;

/**
 * Export the FSEventWrapBinding constructor.
 * @type {function()}
 */
exports = module.exports = FSEventWrapBinding;
