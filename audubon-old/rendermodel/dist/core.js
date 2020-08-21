define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Group = exports.ContainerNode = exports.ResourceNode = exports.SimpleNode = exports.AbstractNode = void 0;
    class AbstractNode {
        constructor(parent) {
            this._ready = false;
            this._disposed = false;
            this._destroyed = false;
            if (parent) {
                if (parent.disposed) {
                    throw new Error("Parent is disposed.");
                }
                parent.addChild(this);
            }
        }
        get ready() {
            return this._ready;
        }
        _setReady() {
            this._ready = true;
        }
        get disposed() {
            return this._disposed;
        }
        _setDisposed() {
            this._ready = false;
            this._disposed = true;
        }
        get destroyed() {
            return this._destroyed;
        }
        _setDestroyed() {
            if (!this.disposed) {
                throw new Error("Cannot destroy a node that has not been disposed first.");
            }
            this._destroyed = true;
        }
    }
    exports.AbstractNode = AbstractNode;
    class SimpleNode extends AbstractNode {
        constructor(parent) {
            super(parent);
        }
        dispose() {
            this._setDisposed();
        }
    }
    exports.SimpleNode = SimpleNode;
    class ResourceNode extends SimpleNode {
        constructor(parent) {
            super(parent);
            this._invalidated = false;
        }
        update(_state) {
            return true;
        }
        _setInvalidated() {
            if (this.disposed) {
                throw new Error("Disposed resources cannot be invalidated.");
            }
            this._invalidated = true;
        }
        process(state) {
            if (this.destroyed || (this.ready && !this.disposed && !this._invalidated)) {
                return true;
            }
            if (this.disposed) {
                if (this.destroy(state)) {
                    this._setDestroyed();
                }
                else {
                    return false;
                }
            }
            else if (!this.ready /* Is this good? */) {
                if (this.load(state)) {
                    this._setReady();
                }
                else {
                    return false;
                }
            }
            if (this._invalidated) {
                if (this.update(state)) {
                    this._invalidated = false;
                }
                else {
                    return false;
                }
            }
            return true;
        }
    }
    exports.ResourceNode = ResourceNode;
    class ContainerNode extends AbstractNode {
        constructor(parent) {
            super(parent);
            this._children = [];
        }
        addChild(child) {
            this._children.push(child);
        }
        dispose() {
            if (this._children.length > 0) {
                throw new Error("Cannot dispose a container with children.");
            }
            this._setDisposed();
        }
        processChildren(state) {
            let allProcessed = true;
            let foundDestroyed = false;
            for (const child of this._children) {
                if (child.destroyed) {
                    foundDestroyed = true;
                }
                else {
                    allProcessed = child.process(state) && allProcessed;
                }
            }
            if (foundDestroyed) {
                this._children = this._children.filter((child) => !child.destroyed);
            }
            return allProcessed;
        }
    }
    exports.ContainerNode = ContainerNode;
    class Group extends ContainerNode {
        constructor(parent) {
            super(parent);
        }
        process(state) {
            return this.processChildren(state);
        }
    }
    exports.Group = Group;
});
