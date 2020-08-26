define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GroupNode = exports.ContainerNode = exports.SimpleResourceNode = exports.ResourceNode = exports.LeafNode = exports.AbstractNode = exports.ResourceSet = void 0;
    class ResourceSet {
        constructor() {
            this._map = new Map();
        }
        addNode(id, node) {
            this._map.set(id, node);
        }
        removeNode(id) {
            this._map.delete(id);
        }
        get(qualifiedName) {
            let [id, name] = qualifiedName.split(".");
            const node = this._map.get(id);
            if (!node) {
                return null;
            }
            if (!name) {
                name = "";
            }
            return node.getResource(name);
        }
    }
    exports.ResourceSet = ResourceSet;
    class AbstractNode {
        constructor(parent) {
            this._ready = false;
            this._disposed = false;
            this._destroyed = false;
            this.id = null;
            if (parent) {
                if (parent.disposed) {
                    throw new Error("A disposed node cannot be a parent.");
                }
                parent.addChild(this);
            }
        }
        get ready() {
            return this._ready;
        }
        _setReady() {
            if (this._disposed) {
                throw new Error("Cannot mark as ready a disposed node.");
            }
            this._ready = true;
        }
        _resetReady() {
            this._ready = false;
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
    class LeafNode extends AbstractNode {
        constructor(parent) {
            super(parent);
        }
        dispose() {
            this._setDisposed();
        }
    }
    exports.LeafNode = LeafNode;
    class ResourceNode extends LeafNode {
        constructor(parent) {
            super(parent);
        }
    }
    exports.ResourceNode = ResourceNode;
    class SimpleResourceNode extends ResourceNode {
        constructor(parent) {
            super(parent);
            this._invalidated = false;
        }
        update(_state, _resources) {
            return true;
        }
        _setInvalidated() {
            if (this.disposed) {
                throw new Error("Disposed resources cannot be invalidated.");
            }
            this._invalidated = true;
        }
        process(state, resources) {
            if (this.destroyed || (this.ready && !this.disposed && !this._invalidated)) {
                return true;
            }
            if (this.disposed) {
                if (this.destroy(state, resources)) {
                    this._setDestroyed();
                }
                else {
                    return false;
                }
            }
            else if (!this.ready /* Is this good? */) {
                if (this.load(state, resources)) {
                    this._setReady();
                }
                else {
                    return false;
                }
            }
            if (this._invalidated /* Can you invalidate a resource that is not ready yet? */) {
                if (this.update(state, resources)) {
                    this._invalidated = false;
                }
                else {
                    return false;
                }
            }
            return true;
        }
    }
    exports.SimpleResourceNode = SimpleResourceNode;
    class ContainerNode extends AbstractNode {
        constructor(parent) {
            super(parent);
            this._children = [];
        }
        addChild(child) {
            if (this.disposed) {
                throw new Error("Cannot add a child to a disposed parent.");
            }
            this._children.push(child);
        }
        dispose() {
            if (this._children.length > 0) {
                throw new Error("Cannot dispose a container with children.");
            }
            this._setDisposed();
        }
        processChildren(state, resources) {
            const foundDestroyed = this._children.reduce((foundDestroyed, child) => foundDestroyed || child.destroyed, false);
            if (foundDestroyed) {
                this._children = this._children.filter((child) => !child.destroyed);
            }
            const ids = [];
            for (const child of this._children) {
                if (child instanceof ResourceNode && child.ready && child.id) {
                    resources.addNode(child.id, child);
                    ids.push(child.id);
                }
            }
            let allProcessed = true;
            for (const child of this._children) {
                allProcessed = child.process(state, resources) && allProcessed;
            }
            for (const id of ids) {
                resources.removeNode(id);
            }
            return allProcessed;
        }
    }
    exports.ContainerNode = ContainerNode;
    class GroupNode extends ContainerNode {
        constructor(parent) {
            super(parent);
        }
        process(state, resources) {
            return this.processChildren(state, resources);
        }
    }
    exports.GroupNode = GroupNode;
});
