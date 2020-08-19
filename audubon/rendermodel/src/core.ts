export abstract class AbstractNode<S> {
  private _ready = false;
  private _disposed = false;
  private _destroyed = false;
  
  constructor(parent: ContainerNode<S>) {
    if (parent) {
      if (parent.disposed) {
        throw new Error("Parent is disposed.");
      }

      parent.addChild(this);
    }
  }

  abstract process(state: S): boolean;

  get ready(): boolean {
    return this._ready;
  }

  protected _setReady(): void {
    this._ready = true;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  protected _setDisposed(): void {
    this._ready = false;
    this._disposed = true;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  protected _setDestroyed(): void {
    if (!this.disposed) {
      throw new Error("Cannot destroy a node that has not been disposed first.");
    }

    this._destroyed = true;
  }
}
  
export abstract class SimpleNode<S> extends AbstractNode<S> {
  constructor(parent: ContainerNode<S>) {
    super(parent);
  }
  
  dispose(): void {
    this._setDisposed();
  }
}

export abstract class ResourceNode<S> extends SimpleNode<S> {
  private _invalidated = false;

  constructor(parent: ContainerNode<S>) {
    super(parent);
  }

  abstract load(state: S): boolean;

  update(_state: S): boolean {
    return true;
  }
  
  abstract destroy(state: S): boolean;

  protected _setInvalidated(): void {
    if (this.disposed) {
      throw new Error("Disposed resources cannot be invalidated.");
    }

    this._invalidated = true;
  }

  process(state: S): boolean {
    if (this.destroyed || (this.ready && !this.disposed && !this._invalidated)) {
      return true;
    }

    if (this.disposed) {
      if (this.destroy(state)) {
        this._setDestroyed();
      } else {
        return false;
      }
    } else if (!this.ready /* Is this good? */) {
      if (this.load(state)) {
        this._setReady();
      } else {
        return false;
      }
    }

    if (this._invalidated) {
      if (this.update(state)) {
        this._invalidated = false;
      } else {
        return false;
      }
    }

    return true;
  }
}

export abstract class ContainerNode<S> extends AbstractNode<S> {
  private _children: AbstractNode<S>[] = [];
  
  constructor(parent: ContainerNode<S>) {
    super(parent);
  }

  addChild(child: AbstractNode<S>): void {
    this._children.push(child);
  }
  
  dispose(): void {
    if (this._children.length > 0) {
      throw new Error("Cannot dispose a container with children.");
    }
    
    this._setDisposed();
  }
  
  processChildren(state: S): boolean {
    let allProcessed = true;
    let foundDestroyed = false;
    
    for (const child of this._children) {
      if (child.destroyed) {
        foundDestroyed = true;
      } else {
        allProcessed = child.process(state) && allProcessed;
      }
    }
    
    if (foundDestroyed) {
      this._children = this._children.filter((child) => !child.destroyed);
    }
    
    return allProcessed;
  }
}

export class Group<S> extends ContainerNode<S> {
  constructor(parent: ContainerNode<S>) {
    super(parent);
  }

  process(state: S): boolean {
    return this.processChildren(state);
  }
}